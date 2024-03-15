import * as cdk from "aws-cdk-lib";
import { Construct } from 'constructs';

import * as msk from 'aws-cdk-lib/aws-msk';
import * as ec2 from 'aws-cdk-lib/aws-ec2';




import {CfnParameter, CustomResource, Duration} from "aws-cdk-lib";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Provider} from "aws-cdk-lib/custom-resources";
import {RetentionDays} from "aws-cdk-lib/aws-logs";


export class MskStack extends cdk.Stack {
   

    public vpc: ec2.Vpc;
    public kafkaSecurityGroup: ec2.SecurityGroup;
    // public fargateSercurityGroup: ec2.SecurityGroup;
    public lambdaSecurityGroup: ec2.SecurityGroup;
    public kafkaCluster: msk.CfnCluster;

    
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.createVPC();
        this.createMSKCluster();
        this.provisionTopicLambda();

   }
    

   private createVPC = () => {

        this.vpc = new ec2.Vpc(this, 'vpc');

        this.kafkaSecurityGroup = new ec2.SecurityGroup(this, 'kafkaSecurityGroup', {
            securityGroupName: 'kafkaSecurityGroup',
            vpc: this.vpc,
            allowAllOutbound: true
        });

        this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'lambdaSecurityGroup', {
            securityGroupName: 'lambdaSecurityGroup',
            vpc: this.vpc,
            allowAllOutbound: true
        });

        this.kafkaSecurityGroup.connections.allowFrom(this.lambdaSecurityGroup, ec2.Port.allTraffic(), "allowFromLambdaToKafka");
    };


    
    private createMSKCluster = () => {

        this.kafkaCluster = new msk.CfnCluster(this, "kafkaCluster", {
            brokerNodeGroupInfo: {
                securityGroups: [this.kafkaSecurityGroup.securityGroupId],
                clientSubnets: [ ...this.vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS}).subnetIds],
                instanceType: "kafka.t3.small",
                storageInfo: {
                    ebsStorageInfo: {
                        volumeSize: 5
                    }
                }
            },
            clusterName: "TransactionsKafkaCluster",
            kafkaVersion: "2.7.0",
            numberOfBrokerNodes: 2
        });
     
    };


    private provisionTopicLambda = () => {

        const bootstrapAddress = new CfnParameter(this, "bootstrapAddress", {
            type: "String",
            description: "Bootstrap address for Kafka broker. Corresponds to bootstrap.servers Kafka consumer configuration"
        }).valueAsString;

        let topicName = new CfnParameter(this, "topicName", {
            type: "String",
            description: "Name of the Kafka topic to be created"
        }).valueAsString;

        // Lambda function to support cloudformation custom resource to create kafka topics.
        const kafkaTopicHandler = new NodejsFunction(this, "KafkaTopicHandler", {
            runtime: Runtime.NODEJS_18_X,
            entry: 'lambda/kafka-topic-handler.ts',
            handler: 'handler',
            vpc: this.vpc,
            securityGroups: [this.lambdaSecurityGroup],
            functionName: 'KafkaTopicHandler',
            timeout: Duration.minutes(5),
            environment: {
                'BOOTSTRAP_ADDRESS': bootstrapAddress
            }
        });

        kafkaTopicHandler.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['kafka:*'],
            resources: [this.kafkaCluster.ref]
        }));

        const kafkaTopicHandlerProvider = new Provider(this, 'KafkaTopicHandlerProvider', {
            onEventHandler: kafkaTopicHandler,
            logRetention: RetentionDays.TWO_WEEKS
        });

        const kafkaTopicResource = new CustomResource(this, 'KafkaTopicResource', {
            serviceToken: kafkaTopicHandlerProvider.serviceToken,
            properties: {
                topicConfig: {
                    topic: topicName,
                    numPartitions: 1,
                    replicationFactor: 2
                }
            }
        });
    }

   
}
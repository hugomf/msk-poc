import * as cdk from "aws-cdk-lib";
import { Construct } from 'constructs';

import {CfnParameter, CustomResource, Duration} from "aws-cdk-lib";
import {VpcStack} from "./vpc-stack";
import {KafkaStack} from "./kafka-stack";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {Provider} from "aws-cdk-lib/custom-resources";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

export class KafkaTopicStack extends cdk.Stack {

    constructor(vpcStack: VpcStack, kafkaStack: KafkaStack, scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

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
            vpc: vpcStack.vpc,
            securityGroups: [vpcStack.lambdaSecurityGroup],
            functionName: 'KafkaTopicHandler',
            timeout: Duration.minutes(5),
            environment: {
                'BOOTSTRAP_ADDRESS': bootstrapAddress
            }
        });

        kafkaTopicHandler.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['kafka:*'],
            resources: [kafkaStack.kafkaCluster.ref]
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
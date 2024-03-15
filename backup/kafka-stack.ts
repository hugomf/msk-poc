import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as msk from 'aws-cdk-lib/aws-msk';
import * as ec2 from 'aws-cdk-lib/aws-ec2'

import {VpcStack} from "./vpc-stack";

export class KafkaStack extends cdk.Stack {
    public kafkaCluster: msk.CfnCluster;

    constructor(vpcStack: VpcStack, scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.kafkaCluster = new msk.CfnCluster(this, "kafkaCluster", {
            brokerNodeGroupInfo: {
                securityGroups: [vpcStack.kafkaSecurityGroup.securityGroupId],
                clientSubnets: [...vpcStack.vpc.selectSubnets({
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
                }).subnetIds],
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
    }
}
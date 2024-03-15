import * as cdk from "aws-cdk-lib";
import { Construct } from 'constructs';

import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcStack extends cdk.Stack {
    public vpc: ec2.Vpc;
    public kafkaSecurityGroup: ec2.SecurityGroup;
    // public fargateSercurityGroup: ec2.SecurityGroup;
    public lambdaSecurityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'vpc');

        this.kafkaSecurityGroup = new ec2.SecurityGroup(this, 'kafkaSecurityGroup', {
            securityGroupName: 'kafkaSecurityGroup',
            vpc: this.vpc,
            allowAllOutbound: true
        });

        // this.fargateSercurityGroup = new ec2.SecurityGroup(this, 'fargateSecurityGroup', {
        //     securityGroupName: 'fargateSecurityGroup',
        //     vpc: this.vpc,
        //     allowAllOutbound: true
        // });

        this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'lambdaSecurityGroup', {
            securityGroupName: 'lambdaSecurityGroup',
            vpc: this.vpc,
            allowAllOutbound: true
        });

        this.kafkaSecurityGroup.connections.allowFrom(this.lambdaSecurityGroup, ec2.Port.allTraffic(), "allowFromLambdaToKafka");
        // this.kafkaSecurityGroup.connections.allowFrom(this.fargateSercurityGroup, ec2.Port.allTraffic(), "allowFromFargateToKafka");
        // this.fargateSercurityGroup.connections.allowFrom(this.kafkaSecurityGroup, ec2.Port.allTraffic(), "allowFromKafkaToFargate");
    }
}
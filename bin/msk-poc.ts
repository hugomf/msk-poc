import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { MskStack } from '../lib/msk-stack';

// import {VpcStack} from "../lib/vpc-stack";
// import {KafkaStack} from '../lib/kafka-stack';
// import {KafkaTopicStack} from "../lib/kafka-topic-stack";

const app = new cdk.App();

let mskStack = new MskStack(app, 'MskStack');
// mskStack.addDependency(vpcStack);
// mskStack.addDependency(kafkaStack);
// mskStack.addDependency(kafkaTopicStack);

// let vpcStack = new VpcStack(app, 'VpcStack');
// let kafkaStack = new KafkaStack(vpcStack, app, 'KafkaStack');
// kafkaStack.addDependency(vpcStack);

// let kafkaTopicStack = new KafkaTopicStack(vpcStack, kafkaStack, app, 'KafkaTopicStack');
// kafkaTopicStack.addDependency(vpcStack);
// kafkaTopicStack.addDependency(kafkaStack);
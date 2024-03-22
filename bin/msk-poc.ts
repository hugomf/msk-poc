import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { MskStack } from '../lib/msk-stack';
import { SchemaRegistryStack } from '../lib/schema-registry-stack'

// import {VpcStack} from "../lib/vpc-stack";
// import {KafkaStack} from '../lib/kafka-stack';
// import {KafkaTopicStack} from "../lib/kafka-topic-stack";

const app = new cdk.App();

let mskStack = new MskStack(app, 'MskStack');
let schemaStack = new SchemaRegistryStack(app, 'SchemaRegistryStack');
schemaStack.addDependency(mskStack);

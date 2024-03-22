import * as cdk from 'aws-cdk-lib';
import { aws_glue as glue } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SchemaRegistryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Glue Schema Registry

    const registryRef = new glue.CfnRegistry(this, 'PriceForce2', {
        name: 'PriceForce2',
        description: 'Schema Registry for PriceForce2',
      });
   

    const schemaRef = new glue.CfnSchema(this, 'MyCfnSchema', {
        compatibility: 'BACKWARD',
        dataFormat: 'AVRO',
        name: 'central-schema-registry',
        schemaDefinition: '{ "type": "string" }',
        description: 'Main Schema Registry for Petco',
        registry: {
          arn: registryRef.attrArn
        },
      });

    // Output the ARN of the created Schema Registry
    new cdk.CfnOutput(this, 'SchemaRegistryARN', {
      value: schemaRef.attrArn,
    });
  }
}

// const app = new cdk.App();
// new SchemaRegistryStack(app, 'GlueSchemaRegistryStack');

import {ITopicConfig} from "kafkajs";

const response = require("cfn-response");
const {Kafka} = require('kafkajs')

const BROKERS = process.env.BOOTSTRAP_ADDRESS?.split(',')

const kafka = new Kafka({
    clientId: 'create-topic-handler',
    brokers: BROKERS,
    ssl: true
});
const admin = kafka.admin();

export const handler = async (event: any, context: any = {}): Promise<any> => {
    try {
        if (event.RequestType === 'Create' || event.RequestType === 'Update') {
            let result = await createTopic(event.ResourceProperties.topicConfig);
            response.send(event, context, response.SUCCESS, {alreadyExists: !result});
        } else if (event.RequestType === 'Delete') {
            await deleteTopic(event.ResourceProperties.topicConfig.topic);
            response.send(event, context, response.SUCCESS, {deleted: true});
        }
    } catch (e) {
        response.send(event, context, response.FAILED, {reason: e});
    }
}

const createTopic = async (topicConfig: ITopicConfig): Promise<boolean> => {
    console.debug("Connecting to kafka admin...");
    await admin.connect();
    console.debug(`Creating topic: ${JSON.stringify(topicConfig)}...`);
    let result = await admin.createTopics({topics: [topicConfig]});
    console.debug(`Topic created`);
    await admin.disconnect()
    return result;
}

const deleteTopic = async (topic: string): Promise<void> => {
    console.debug("Connecting to kafka admin...");
    await admin.connect();

    console.debug(`Deleting topic: ${topic}...`);
    await admin.deleteTopics({topics: [topic]});

    console.debug("Topic deleted");
    await admin.disconnect();
    return;
}
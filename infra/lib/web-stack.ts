import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export type WebStackProps = cdk.StackProps & {
  stage: string;
};

export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const isProd = props.stage === 'prod';

    const siteBucket = new s3.Bucket(this, 'WebBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      autoDeleteObjects: !isProd,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'WebBucketName', {
      value: siteBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'WebBucketUrl', {
      value: siteBucket.bucketWebsiteUrl,
    });
  }
}

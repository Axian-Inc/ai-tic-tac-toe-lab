import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  Aws,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  Tags,
} from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface StaticWebStackProps extends StackProps {
  readonly environmentName: string;
  readonly retainData: boolean;
  readonly webBuildPath: string;
}

export class StaticWebStack extends Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  public constructor(scope: Construct, id: string, props: StaticWebStackProps) {
    super(scope, id, props);

    assertWebBuild(props.webBuildPath);

    const removalPolicy = props.retainData
      ? RemovalPolicy.RETAIN
      : RemovalPolicy.DESTROY;

    this.bucket = new s3.Bucket(this, 'WebAssets', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy,
      autoDeleteObjects: !props.retainData,
      versioned: true,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
        ttl: Duration.seconds(0),
      })),
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    new s3deploy.BucketDeployment(this, 'DeployWebAssets', {
      sources: [s3deploy.Source.asset(props.webBuildPath)],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true,
      cacheControl: [s3deploy.CacheControl.maxAge(Duration.minutes(5))],
    });

    Tags.of(this).add('Application', 'ai-tic-tac-toe');
    Tags.of(this).add('Environment', props.environmentName);
    Tags.of(this).add('ManagedBy', 'aws-cdk');
    Tags.of(this).add('Phase', '1');

    new CfnOutput(this, 'WebsiteUrl', {
      description: 'HTTPS URL of the Tic-Tac-Toe application',
      value: `https://${this.distribution.distributionDomainName}`,
    });
    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
    });
    new CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
    });
    new CfnOutput(this, 'AssetBucketName', {
      value: this.bucket.bucketName,
    });
    new CfnOutput(this, 'DeploymentEnvironment', {
      value: props.environmentName,
    });
    new CfnOutput(this, 'DeploymentRegion', {
      value: Aws.REGION,
    });
  }
}

function assertWebBuild(webBuildPath: string): void {
  const indexPath = path.join(webBuildPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Static web build is missing ${indexPath}. Run npm run build before synth or set WEB_BUILD_PATH.`,
    );
  }
}

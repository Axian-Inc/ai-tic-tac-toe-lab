import assert from 'node:assert/strict';
import * as path from 'node:path';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { StaticWebStack } from '../lib/static-web-stack.js';

const fixturePath = path.resolve('test/fixtures/web');

function synthesize(retainData = true): Template {
  const app = new App();
  const stack = new StaticWebStack(app, 'TestStack', {
    environmentName: 'test',
    retainData,
    webBuildPath: fixturePath,
    env: { account: '111111111111', region: 'us-west-2' },
  });
  return Template.fromStack(stack);
}

run('keeps the S3 origin private, encrypted, versioned, and retained by default', () => {
  const template = synthesize();

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: { Status: 'Enabled' },
    });
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Principal: { AWS: '*' },
            Condition: { Bool: { 'aws:SecureTransport': 'false' } },
          }),
          Match.objectLike({
            Effect: 'Allow',
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Condition: {
              StringEquals: {
                'AWS:SourceArn': Match.anyValue(),
              },
            },
          }),
        ]),
      },
    });
});

run('uses signed OAC access, HTTPS redirect, security headers, and SPA fallback', () => {
  const template = synthesize();

    template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: {
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      },
    });
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: 'index.html',
        PriceClass: 'PriceClass_100',
        HttpVersion: 'http2and3',
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
          Compress: true,
          OriginRequestPolicyId: Match.absent(),
          ResponseHeadersPolicyId: Match.anyValue(),
        }),
        CustomErrorResponses: Match.arrayWith([
          {
            ErrorCode: 403,
            ErrorCachingMinTTL: 0,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          },
          {
            ErrorCode: 404,
            ErrorCachingMinTTL: 0,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
          },
        ]),
      }),
    });
});

run('deploys and invalidates the built application', () => {
  const template = synthesize();

    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      DestinationBucketName: Match.anyValue(),
      DistributionId: Match.anyValue(),
      DistributionPaths: ['/*'],
      Prune: true,
    });
  const outputNames = Object.keys(template.toJSON().Outputs);
  for (const expectedOutput of [
    'WebsiteUrl',
    'DistributionId',
    'DistributionDomainName',
    'AssetBucketName',
    'DeploymentEnvironment',
    'DeploymentRegion',
  ]) {
    assert.ok(outputNames.includes(expectedOutput), `Missing ${expectedOutput}`);
  }
});

run('supports explicitly authorized ephemeral L&D teardown', () => {
  const template = synthesize(false);

  template.hasResource('AWS::S3::Bucket', {
    DeletionPolicy: 'Delete',
    UpdateReplacePolicy: 'Delete',
  });
  template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);
});

function run(name: string, assertion: () => void): void {
  try {
    assertion();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n`);
    throw error;
  }
}

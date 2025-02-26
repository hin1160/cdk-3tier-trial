#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';
//cdk-nagのライブラリ
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
new CdkWorkshopStack(app, 'CdkWorkshopStack');

//AWS Solutionsのルール群を適用
Aspects.of(app).add(new AwsSolutionsChecks());

import * as cdk from 'aws-cdk-lib';
import { Annotations, Template, Match } from 'aws-cdk-lib/assertions';
import * as CdkWorkshop from '../lib/cdk-workshop-stack';
// cdk-nag用のライブラリを追加
import { App, Aspects, Stack } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag'

// cdk-nagのテスト
describe('cdk-nag AwsSolutions Pack', () => {
  let stack: Stack;
  let app: App;
  // In this case we can use beforeAll() over beforeEach() since our tests 
  // do not modify the state of the application 
  beforeAll(() => {
    // GIVEN
    app = new App();
    stack = new CdkWorkshop.CdkWorkshopStack(app, 'MyTestStack');


    // WHEN
    Aspects.of(stack).add(new AwsSolutionsChecks());
  });

  // THEN
  test('No unsuppressed Warnings', () => {
    const warnings = Annotations.fromStack(stack).findWarning(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*')
    );
    expect(warnings).toHaveLength(0);
  });

  test('No unsuppressed Errors', () => {
    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*')
    );
    expect(errors).toHaveLength(0);
  });
});


test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkWorkshop.CdkWorkshopStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SQS::Queue', {
    VisibilityTimeout: 300
  });
  template.resourceCountIs('AWS::SNS::Topic', 1);
});

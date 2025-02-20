import { CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { readFileSync } from "fs";

// Construct props を定義
export interface WebServerInstanceProps {
  readonly vpc: ec2.CfnVPC
  // readonly subnetId: string
}

// EC2 インスタンスを含む Construct を定義
export class WebServerInstance extends Construct {
  // 外部からインスタンスへアクセスできるように設定
  public readonly instance: ec2.CfnInstance;

  constructor(scope: Construct, id: string, props: WebServerInstanceProps) {
    super(scope, id);

    // Construct props から vpc を取り出す
    const { subnetId } = props;

    // ユーザーデータを読み込む
    const script = readFileSync("./lib/resources/user-data.sh", "utf8");

    //EC2インスタンスを作成する
    const instance = new ec2.CfnInstance(this, "Instance", {
      subnetId: subnetId,
      instanceType: "t3.small", 
      imageId: "ami-02e5504ea463e3f34",
      userData: script,
      securityGroupIds: [""] //★TODO:EC2用にTCP80でインバウンドを許可するSGを作成する
    });

    // 作成した EC2 インスタンスをプロパティに設定
    this.instance = instance;
  
    // new CfnOutput(this, "WordpressServer1PublicIPAddress", {
    //   value: `http://${instance.instancePublicIp}`,
    // });
  }
}
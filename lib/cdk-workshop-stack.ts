import { aws_elasticloadbalancingv2, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

// ファイルを読み込むためのパッケージを import
import { readFileSync } from 'fs';
//CFnOutputをimport
import { CfnOutput } from 'aws-cdk-lib';

//ここからリソースを作成
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    //vpcを宣言
    const vpc = new ec2.Vpc(this, "BlogVpc", {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });

    //ec2を宣言
    const webServer1 = new ec2.Instance(this, "WordPressServer1", {
      //インスタンスを配置するVPCを指定
      vpc,
      //インスタンスタイプを指定
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      //マシンイメージを指定
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      //インスタンスを配置するサブネットを指定
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC},

    });

    //user-date.shを読み込み、変数に格納
    const script =  readFileSync("./lib/resources/user-data.sh", "utf8");

    //EC2インスタンスにユーザーデータを追加
    webServer1.addUserData(script);

    //port80, すべてのIPアドレスからのアクセスを許可
    webServer1.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    //インスタンスのパブリックIPを含むURLを出力
    new CfnOutput(this, "WordpressServer1PublicIPAddress", {
      value: `http://${webServer1.instancePublicIp}`
    });
    

    //rdsを宣言
    const rdsServer1 = new rds.DatabaseInstance(this, "primaryRdsServer1", {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_36}),
      vpc,
      databaseName: "wordpress",
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
    });

    //webServerからのアクセスのみを許可
    rdsServer1.connections.allowDefaultPortFrom(webServer1);
  
  //ALBを宣言
  const alb = new elbv2.ApplicationLoadBalancer(this, "wordPressALB", {
    vpc,
    internetFacing: true
  });

  //リスナーを追加
  const albListner = alb.addListener("wordPressALBListner", {port: 80});

  
  }
}


resource "aws_iam_policy" "aws_load_balancer_controller" {
    policy = jsonencode({
        Version = "2012-10-17",
        Statement = [
            {
                Sid    = "AllowSLRForELB",
                Effect = "Allow",
                Action = ["iam:CreateServiceLinkedRole"],
                Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/elasticloadbalancing.amazonaws.com/*",
                Condition = {
                    StringEquals = {
                        "iam:AWSServiceName" = "elasticloadbalancing.amazonaws.com"
                    }
                }
            },            
            {
                Sid    = "DescribeEC2Resources",
                Effect = "Allow",
                Action = [
                    "ec2:Describe*",
                    "ec2:GetCoipPoolUsage",
                    "ec2:GetIpamPoolCidrs",
                    "ec2:GetSecurityGroupsForVpc"
                ],
                Resource = "*"
            },
            {
                Sid    = "ManageEC2SecurityGroups",
                Effect = "Allow",
                Action = [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:CreateSecurityGroup"
                ],
                Resource = [
                    "arn:aws:ec2:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:security-group/*",
                    "arn:aws:ec2:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:vpc/*"
                ]
            },
            {
                Sid    = "DescribeELBResources",
                Effect = "Allow",
                Action = ["elasticloadbalancing:Describe*"],
                Resource = "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:*"
            },
            {
                Sid    = "AccessCognitoAndCertificates",
                Effect = "Allow",
                Action = [
                    "cognito-idp:DescribeUserPoolClient",
                    "acm:ListCertificates",
                    "acm:DescribeCertificate",
                    "iam:ListServerCertificates",
                    "iam:GetServerCertificate"
                ],
                Resource = [
                    "arn:aws:cognito-idp:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:*",
                    "arn:aws:acm:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:*",
                    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:server-certificate/*"
                ]
            },
            {
                Sid    = "AccessWAFAndShield",
                Effect = "Allow",
                Action = [
                    "waf-regional:GetWebACL",
                    "waf-regional:GetWebACLForResource",
                    "waf-regional:AssociateWebACL",
                    "waf-regional:DisassociateWebACL",
                    "wafv2:GetWebACL",
                    "wafv2:GetWebACLForResource",
                    "wafv2:AssociateWebACL",
                    "wafv2:DisassociateWebACL",
                    "shield:DescribeProtection",
                    "shield:GetSubscriptionState",
                    "shield:DescribeSubscription",
                    "shield:CreateProtection",
                    "shield:DeleteProtection"
                ],
                Resource = [
                    "arn:aws:wafv2:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:*",
                    "arn:aws:waf-regional:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:*",
                    "arn:aws:shield::${data.aws_caller_identity.current.account_id}:*"
                ]
            },
            {
                Sid    = "TagNewSecurityGroupsWithClusterTag",
                Effect = "Allow",
                Action = ["ec2:CreateTags"],
                Resource = "arn:aws:ec2:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:security-group/*",
                Condition = {
                    StringEquals = {
                        "ec2:CreateAction" = "CreateSecurityGroup"
                    },
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageTagsOnTaggedSecurityGroups",
                Effect = "Allow",
                Action = [
                    "ec2:CreateTags",
                    "ec2:DeleteTags"
                ],
                Resource = "arn:aws:ec2:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:security-group/*",
                Condition = {
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageIngressOnTaggedSecurityGroups",
                Effect = "Allow",
                Action = [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:DeleteSecurityGroup"
                ],
                Resource = [
                    "arn:aws:ec2:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:security-group/*"
                ],
                Condition = {
                    Null = {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "CreateTaggedELBResources",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*/*"
                ],
                Condition = {
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageTagsOnELBResources",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/net/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/app/*/*"
                ],
                Condition = {
                    Null = {
                        "aws:RequestTag/elbv2.k8s.aws/cluster"  = "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "ManageTagsOnELBListenersAndRules",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:listener/net/*/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:listener/app/*/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:listener-rule/net/*/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:listener-rule/app/*/*/*"
                ]
            },
            {
                Sid    = "ModifyOrDeleteTaggedELBResources",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                    "elasticloadbalancing:SetIpAddressType",
                    "elasticloadbalancing:SetSecurityGroups",
                    "elasticloadbalancing:SetSubnets",
                    "elasticloadbalancing:DeleteLoadBalancer",
                    "elasticloadbalancing:ModifyTargetGroup",
                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                    "elasticloadbalancing:DeleteTargetGroup"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/*/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*/*"
                ],
                Condition = {
                    Null = {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster" = "false"
                    }
                }
            },
            {
                Sid    = "RegisterAndDeregisterTargets",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:RegisterTargets",
                    "elasticloadbalancing:DeregisterTargets"
                ],
                Resource = "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:targetgroup/*/*"
            },
            {
                Sid    = "ConfigureELBListenerRules",
                Effect = "Allow",
                Action = [
                    "elasticloadbalancing:SetWebAcl",
                    "elasticloadbalancing:ModifyListener",
                    "elasticloadbalancing:AddListenerCertificates",
                    "elasticloadbalancing:RemoveListenerCertificates",
                    "elasticloadbalancing:ModifyRule"
                ],
                Resource = [
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:listener/*/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:listener-rule/*/*/*",
                    "arn:aws:elasticloadbalancing:${data.aws_region.current_region.name}:${data.aws_caller_identity.current.account_id}:loadbalancer/*/*/*"
                ]
            }
        ]
    })
    tags = {
        Name = "AWSLoadBalancerControllerIAMPolicy"
    }
}

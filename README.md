aws-angular
===========

AngularJS and Amazon JavaScript SDK
created using guide from: http://www.ng-newsletter.com/posts/aws-js-sdk.html

1) Log into Amazon AWS and go to: https://console.aws.amazon.com/dynamodb/home
2) Create a table called Users with a hash key of 'User email'
3) Create a table called UsersItems with a primary hash key of 'User email' and primary range key of 'ItemId'
4) Go to: https://console.aws.amazon.com/s3/home and create a bukect called 'ng-app-test'
5) Click Bucket > Properties > Permissions > Edit CORS Configuration, and enter these unrestricted settings:

    <?xml version="1.0" encoding="UTF-8"?>
    <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
        <CORSRule>
            <AllowedOrigin>*</AllowedOrigin>
            <AllowedMethod>GET</AllowedMethod>
            <AllowedMethod>PUT</AllowedMethod>
            <AllowedMethod>POST</AllowedMethod>
            <AllowedMethod>DELETE</AllowedMethod>
            <MaxAgeSeconds>3000</MaxAgeSeconds>
            <AllowedHeader>*</AllowedHeader>
            </CORSRule>
    </CORSConfiguration>
    
Note: you will want to restrict these settings before going live

6) Go to: https://console.aws.amazon.com/iam/home
7) Click Roles > Create new role > 'google-web-role'
8) Select 'Role for Identity Provider Access' and 'Grant access to web identity providers'
9) Select Identity Provider and Google and enter the client ID from a new Google cloud app at https://console.developers.google.com/project
10) Set the policy conditions to access the S3 and DynamoDB services

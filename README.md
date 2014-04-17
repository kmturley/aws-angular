aws-angular
===========

AngularJS and Amazon JavaScript SDK
created using guide from: http://www.ng-newsletter.com/posts/aws-js-sdk.html

* Log into Amazon AWS and go to: https://console.aws.amazon.com/dynamodb/home
* Create a table called Users with a hash key of 'User email'
* Create a table called UsersItems with a primary hash key of 'User email' and primary range key of 'ItemId'
* Go to: https://console.aws.amazon.com/s3/home and create a bukect called 'ng-app-test'
* Click Bucket > Properties > Permissions > Edit CORS Configuration, and enter these unrestricted settings:

```xml

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

```

Note: you will want to restrict these settings before going live

* Go to: https://console.aws.amazon.com/iam/home
* Click Roles > Create new role > 'google-web-role'
* Select 'Role for Identity Provider Access' and 'Grant access to web identity providers'
* Select Identity Provider and Google and enter the client ID from a new Google cloud app at https://console.developers.google.com/project
* Set the policy conditions to access the S3 and DynamoDB services to give access to the site
* Update the ARN in js/app.js here and the client id html/main.html to finish the setup
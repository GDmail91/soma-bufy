/**
 * Created by YS on 2016-07-19.
 */
var credentials = require('../credentials');

function uploadImage(req, data, callback) {
    var formidable = require('formidable');
    var form = new formidable.IncomingForm();

    // 파일 폼 파싱
    form.parse(req, function(err, fields, files) {
        if (err) {
            callback(false, "err");
        }

        console.log(files);
        // set mime type
        var mime_type = '';
        switch (files.content_img.type) {
            case 'image/jpeg':
                mime_type = '.jpg';
                break;
            case 'image/gif':
                mime_type = '.gif';
                break;
            case 'image/png':
                mime_type = '.png';
                break;
        }

        // S3 서버에 이미지 업로드
        var AWS = require('aws-sdk');
        var fs = require('fs');
        var gm = require('gm').subClass({ imageMagick: true });
        var buffer = new Buffer(0);

        // Read in the file, convert it to base64, store to S3
        var fileStream = fs.createReadStream(files.content_img.path);
        fileStream.on('error', function (err) {
            if (err) {
                throw err;
            }
        });
        fileStream.on('data', function (data) {
            buffer = Buffer.concat([buffer, data]);
        });
        fileStream.on('end', function() {
            AWS.config.update({
                accessKeyId: credentials.aws.aws_access_key_id,
                secretAccessKey: credentials.aws.aws_secret_access_key,
                "region": "ap-northeast-2"
            });
            var s3 = new AWS.S3();

            // image name hashing
            var crypto = require('crypto');
            var salt = Math.round((new Date().valueOf() * Math.random())) + "";
            var image_name = crypto.createHash("sha256").update(files.content_img.name + salt).digest("hex") + mime_type;

            // bucket info & file info
            var bucketName = 'soma-bufy-storage';
            var keyName = 'images/'+image_name;

            s3.putObject({
                Bucket: bucketName,
                Key: keyName,
                Body: buffer
            }, function (err) {
                if (err) { throw err; }
                // Thubmnail image generate
                var smImage = new Buffer(0);
                gm(buffer)
                    .resize("300", "300")
                    .stream(function (err, stdout, stderr) {
                        stdout.on('data', function (data) {
                            smImage = Buffer.concat([smImage, data]);
                        });
                        stdout.on('end', function () {
                            var data = {
                                Bucket: bucketName,
                                Key: 'images/thumb/' + image_name,
                                Body: smImage
                            };
                            s3.putObject(data, function (err, res) {
                                if (err) {
                                    throw err;
                                }
                                console.log('thumbnail generate done');
                            });
                        });
                    });
                // Rest API 사진정보 전송
                var dummy_data = {
                    image_url: image_name,
                    image_name: files.content_img.name,
                    author: data.user_id,
                    content_title: fields.content_title,
                    description: fields.description
                };

                callback(true, "업로드 완료", dummy_data);
            });
        });
    });
}

/**
 * Overwrite Image on S3
 * @param req
 * @param data
 * @param origin_url
 * @param callback
 */
function overwriteImage(req, data, origin_url, callback) {
    var formidable = require('formidable');
    var form = new formidable.IncomingForm();

    // 파일 폼 파싱
    form.parse(req, function(err, fields, files) {
        if (err) {
            callback(false, "err");
        }

        // set mime type
        var mime_type = '';
        switch (files.content_img.type) {
            case 'image/jpeg':
                mime_type = '.jpg';
                break;
            case 'image/gif':
                mime_type = '.gif';
                break;
            case 'image/png':
                mime_type = '.png';
                break;
        }

        var overwrite_url = origin_url.split('.')[0] + mime_type;

        // S3 서버에 이미지 업로드
        var AWS = require('aws-sdk');
        var fs = require('fs');
        var gm = require('gm').subClass({ imageMagick: true });
        var buffer = new Buffer(0);

        // Read in the file, convert it to base64, store to S3
        var fileStream = fs.createReadStream(files.content_img.path);
        fileStream.on('error', function (err) {
            if (err) {
                throw err;
            }
        });
        fileStream.on('data', function (data) {
            buffer = Buffer.concat([buffer, data]);
        });
        fileStream.on('end', function() {
            AWS.config.update({
                accessKeyId: credentials.aws.aws_access_key_id,
                secretAccessKey: credentials.aws.aws_secret_access_key,
                "region": "ap-northeast-2"
            });
            var s3 = new AWS.S3();

            // bucket info & file info
            var bucketName = 'soma-bufy-storage';
            var keyName = 'images/'+overwrite_url;

            s3.putObject({
                Bucket: bucketName,
                Key: keyName,
                Body: buffer
            }, function (err) {
                if (err) { throw err; }
                // Thubmnail image generate
                var smImage = new Buffer(0);
                gm(buffer)
                    .resize("300", "300")
                    .stream(function (err, stdout, stderr) {
                        stdout.on('data', function (data) {
                            smImage = Buffer.concat([smImage, data]);
                        });
                        stdout.on('end', function () {
                            var data = {
                                Bucket: bucketName,
                                Key: 'images/thumb/' + overwrite_url,
                                Body: smImage
                            };
                            s3.putObject(data, function (err, res) {
                                if (err) {
                                    throw err;
                                }
                                console.log('thumbnail generate done');
                            });
                        });
                    });
                // Rest API 사진정보 전송
                var dummy_data = {
                    image_url: overwrite_url,
                    image_name: files.content_img.name,
                    author: data.user_id,
                    content_title: fields.content_title,
                    description: fields.description
                };

                callback(true, "업로드 완료", dummy_data);
            });
        });
    });
}

function getImage(content_img, res) {
    var AWS = require('aws-sdk');
    AWS.config.update({
        accessKeyId: credentials.aws.aws_access_key_id,
        secretAccessKey: credentials.aws.aws_secret_access_key,
        "region": "ap-northeast-2"
    });

    // bucket info & file info
    var bucketName = 'soma-bufy-storage';
    var keyName = 'images/'+content_img;

    var s3 = new AWS.S3();

    res.writeHead(200, {'Content-Type': 'image/*' });
    s3.getObject({
        Bucket: bucketName,
        Key: keyName,
    }).createReadStream().pipe(res);
}

module.exports.uploadImage = uploadImage;
module.exports.overwriteImage = overwriteImage;
module.exports.getImage = getImage;

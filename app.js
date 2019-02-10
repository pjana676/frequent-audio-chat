/**
 * Created by pritam on 2/9/19.
 */
var http = require('http');
var chatRoom = require('./lib/chatRoom');
var fs = require('fs');
var totalUsers={};
//create a server object:
http.createServer(function (req, res) {
    this.bodyParser=function(req,cb){
        if(req.headers['content-type'] === 'application/x-www-form-urlencoded; charset=UTF-8') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                cb(getQueryVar(body));
            });
        }
        function getQueryVar(queryString){
            var query = {};
            var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
            return query;
        }
    }
    this.sendResponse=function(responseMessage,statusCode,contentType){
        console.log(responseMessage)
        if(!contentType) contentType='text/html';
        res.writeHead(statusCode,{'Content-Type': contentType}); // http header
        res.write((typeof responseMessage=='object')?JSON.stringify(responseMessage):responseMessage.toString());
        res.end();
    };
    this.hashCode=function(str){
        return str.split('').reduce(function(prevHash,currVal){
            prevHash+=((((prevHash << 5) - prevHash) + currVal.charCodeAt(0)<<3)|0);
            return prevHash;
        },'0')
    };
    if(req.url ==='/'){
        fs.readFile("index.html", (err,fileContent) =>
        {
            res.writeHead(200, {'Content-Type': 'text/html'}); // http header
            res.end(fileContent);
        });
    }
    else if(req.method=='POST' && req.url ==='/api/auth/sign-up'){
        var parent=this;
        this.bodyParser(req,function(body){
            if(body.user_name && body.password){
                if(totalUsers[body.user_name]){
                    parent.sendResponse('User Name Already exist !!',400)
                }else{
                    var toDay=new Date().toString()
                    totalUsers[body.user_name]={
                        "user_name":body.user_name,
                        "password":body.password,
                        "access_token":parent.hashCode(body.user_name+body.password),
                        "created_at":toDay,
                        "socket":{}
                    }
                    parent.sendResponse({
                        "message":"Successfully Registration.",
                        "data":{
                            "user_name":body.user_name,
                            "token":parent.hashCode(body.user_name+body.password)
                        }
                    },200,'application/json')
                }
            }else{
                parent.sendResponse('Some parameter missing !!',400)
            }
        })

    }else if(req.method=='POST' && req.url ==='/api/auth/sign-in'){
        var parent=this;
        this.bodyParser(req,function(body){
            if(body.user_name && body.password){
                if(!totalUsers[body.user_name] || totalUsers[body.user_name].password!=parent.hashCode(body.password)){
                    parent.sendResponse('Unauthorized access !!',401)
                }else{
                    var toDay=new Date().toString()
                    totalUsers[body.user_name]={
                        "user_name":body.user_name,
                        "access_token":parent.hashCode(body.user_name+body.password),
                        "socket":{}
                    }
                    parent.sendResponse({
                        "message":"Login Successfully !!",
                        "data":{
                            "user_name":body.user_name,
                            "token":parent.hashCode(body.user_name+body.password)
                        }
                    },200,'application/json')
                }
            }else{
                parent.sendResponse('Some parameter missing !!',400)
            }
        })
    }else{
        res.writeHead(400, {'Content-Type': 'text/html'}); // http header
        res.write('<h1>Not Found!<h1>'); //write a response
        res.end(); //end the response
    }
}).listen(3000, function(){
    chatRoom(this,totalUsers)
    console.log("server start at port 3000");
});

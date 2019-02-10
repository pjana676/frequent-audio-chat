/**
 * Created by pritam on 2/9/19.
 */
var SocketIO = require('socket.io');
var chatRoom=[]
module.exports = function(server,totalUsers){
    var io = SocketIO(server);
    io.on('connection', function(socket){
        socket.on('stream', function(requestData){
            authCheck(requestData.user_token,function(authenticUser){
                if(!authenticUser.user_name){
                    socket.emit('received-message',{
                        "status_code":400,
                        "msg":'You are not an authorized user !!',
                        "stream":{}
                    })
                }else{
                    socket.emit('BroadCastExceptMe',{
                        "stream":requestData.stream,
                        "status_code":200,
                        "msg":''
                    });
                    socket.broadcast.emit('BroadCastExceptMe',{
                        "stream":requestData.stream,
                        "status_code":200,
                        "msg":''
                    });
                }
            })

        });

        socket.on('send-message', function(requestData){
            authCheck(requestData.user_token,function(authenticUser){
                if(!authenticUser.user_name){
                    socket.emit('received-message',{
                        "status_code":400,
                        "msg":'You are not an authorized user !!'
                    })
                }else{
                    socket.emit('received-message',{
                        "status_code":200,
                        "msg":requestData.msg
                    })
                    socket.broadcast.emit('received-message',
                        {
                            "status_code":200,
                            "msg":authenticUser.user_name+" : "+requestData.msg
                        })
                }
            })
        })

        socket.on('disconnect', function (requestData) {
            console.log("/disconnect");
            console.log("requestData    "+requestData)

        });
    });
    function authCheck(token,callBack){
        try{
            callBack(Object.keys(totalUsers).reduce(function(nObject,userName){
                if(totalUsers[userName].access_token==token){
                    nObject=totalUsers[userName]
                }
                return nObject;
            },{}))

        }catch(e){
            callBack(null)
        }
    }
}
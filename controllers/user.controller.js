'use strict'

var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var moment = require('moment');
var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');

function commands(req, res){
    var user = new User();
    var tweet = new Tweet();
    var params = req.body.commands;
    var text = params.split(' ');
    var date = moment().format('MMMM Do YYYY, h:mm:ss a');
    var command = text[0];

    function saveText(comment, start){
        let textTweet = "";
                for(var i = start; i < comment.length; i++){
                    if(i < (comment.length-1)){
                        textTweet = textTweet + text[i] + " ";
                    } else{
                        textTweet = textTweet + text[i];
                    }
                }
        return textTweet.trim();
    }

    function searcher(nameArray){
        var booleanData = false;
        for(var i = 0; i < nameArray.length; i++){
            if(nameArray[i] == req.user.username){
                booleanData = true;
                i = nameArray.length;
            }
        }
        return booleanData;
    }

    switch(command){
        case 'ADD_TWEET':
            if(req.headers.authorization){
                if(saveText(text, 1) != "" && saveText(text, 1).length <= 150){
                    tweet.text = saveText(text, 1);
                    tweet.dateTweet = date;
                    tweet.user = req.user.sub;
                    tweet.save((err, saveTweet)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al publicar tweet'});
                        } else if(saveTweet){
                            res.status(200).send({message: 'Se ha publicado el tweet', saveTweet});
                        } else {
                            res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                        }
                    });
                } else{
                    if(saveText(text, 1).length > 150){
                        res.status(403).send({message: 'Su tweet excede el numero de caracteres permitidos'});
                    } else{
                        res.status(403).send({message: 'No se puede publicar un tweet vacío'});
                    }
                }
            } else{
                res.status(403).send({message: 'No puede publicar un tweet, primero inicie sesión'});
            }
        break;
        case 'DELETE_TWEET':
            if(req.headers.authorization){
                Tweet.findById(text[1], (err, findTweet)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                    } else if(findTweet){
                        if(findTweet.user == req.user.sub){
                            Tweet.findByIdAndRemove(text[1], (err, findTweetAndDelete)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al eliminar tweet'});
                                } else if(findTweetAndDelete){
                                    res.status(200).send({message: 'Se ha eliminado el tweet correctamente'});
                                } else{
                                    res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                }
                            });
                        } else{
                            res.status(403).send({message: 'No posee permisos para eliminar este tweet'});
                        }
                    } else{
                        res.status(404).send({message: 'El tweet que desea eliminar no existe en la base de datos'});
                    }
                });
            } else{
                res.status(400).send({message: 'No puede eliminar un tweet, primero inicie sesión'});
            }
        break;
        case 'EDIT_TWEET':
            if(req.headers.authorization){
                Tweet.findById(text[1], (err, findTweet)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                    } else if(findTweet){
                        if(findTweet.user == req.user.sub){
                            if(saveText(text, 2) != "" && saveText(text, 2).length <= 150){
                                Tweet.findOne({_id: findTweet._id, sourceInformation: / /}, (err, findDocument)=>{
                                    if(err){
                                        res.status(500).send({message: 'Error desconocido en el servidor al buscar documento'});
                                    } else if(findDocument){
                                            Tweet.findByIdAndUpdate(text[1], {commentTweet: saveText(text, 2)}, {new: true}, (err, updateTweet)=>{
                                                if(err){
                                                    res.status(500).send({message: 'Error desconocido en el servidor al actualizar tweet'});
                                                } else if(updateTweet){
                                                    res.status(200).send({message: 'El tweet se actualizó correctamente', updateTweet});
                                                } else{
                                                    res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                                }
                                            });
                                    } else {
                                            Tweet.findByIdAndUpdate(text[1], {text: saveText(text, 2)}, {new: true}, (err, updateTweet)=>{
                                                if(err){
                                                    res.status(500).send({message: 'Error desconocido en el servidor al actualizar tweet'});
                                                } else if(updateTweet){
                                                    res.status(200).send({message: 'El tweet se actualizó correctamente', updateTweet});
                                                } else{
                                                    res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                                }
                                            });
                                    }
                                });
                            } else{
                                if(saveText(text, 1).length > 150){
                                    res.status(403).send({message: 'Su tweet excede el numero de caracteres permitidos'});
                                } else{
                                    res.status(403).send({message: 'No se puede publicar un tweet vacío'});
                                }
                            }
                        } else{
                            res.status(403).send({mesage: 'No posee permisos para actualizar este tweet'});
                        }
                    } else {
                        res.status(400).send({message: 'El tweet que desea editar no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede editar tweets, primero inicie sesión'});
            }
        break;
        case 'VIEW_TWEETS':
            if(req.headers.authorization){
                if(text.length == 1){   
                    Tweet.aggregate([{$project:{'replies': {$size: '$replies'}, 'likes':{$size:'$likes'}, 'retweets':{$size: '$retweets'},
                                      'text': true, 'dateTweet': true, 'user':true, 'commentTweet': true, 'sourceInformation': true}}], (err, findTweets)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al realizar la consulta'});
                        } else if(findTweets){
                            if(findTweets.length == 0){
                                res.status(200).send({message: 'No hay tweets en la base de datos'});                        
                            } else{
                                res.send({message: findTweets});
                            }
                        } else{
                            res.status(500).send({message: 'No se pudo realizar la operación, intente mas tarde'});
                        }
                    });         
                } else if(text.length == 2 && text[1].length != 24){
                    User.findOne({username: text[1]}, (err, findUser)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                        } else if(findUser){
                            Tweet.aggregate([{$match:{user: findUser._id}}, {$project:{'replies': {$size: '$replies'}, 'likes':{$size:'$likes'}, 'retweets':{$size: '$retweets'},
                            'text': true, 'dateTweet': true, 'user':true, 'commentTweet': true, 'sourceInformation': true}}], (err, findTweets)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al realizar la consulta'});
                                } else if(findTweets){
                                    if(findTweets.length == 0){
                                        res.status(200).send({message: 'El usuario ' + findUser.username + ' no tiene tweets'});     
                                    } else{
                                        res.status(200).send({message: findTweets});
                                    }
                                } else{
                                    res.status(500).send({message: 'No se pudo realizar la operación, intente mas tarde'});
                                }
                            });
                        } else{
                            res.status(404).send({message: 'No existe el usuario ' +  text[1]});
                        }
                    });
                } else if(text.length == 2 && text[1].length == 24){
                    Tweet.findById(text[1], (err, findTweet)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                        } else if(findTweet){
                            res.status(200).send({mesage: findTweet});
                        } else{
                            res.status(404).send({mesage: 'El Tweet que esta buscando no existe en la base de datos'});
                        }
                    }).populate('user');
                }else{
                    res.status(404).send({message: 'Error en la sintaxis del comando'});
                }
            } else{
                res.status(403).send({message: 'No puede ver tweets, primero inicie sesión'});
            }
        break;
        case 'LIKE':
            if(req.headers.authorization){
                Tweet.findById(text[1], (err, findTweet)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                    } else if(findTweet){
                        if(searcher(findTweet.likes) == false){
                            User.findById(findTweet.user, (err, findUser)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                                } else if(findUser){
                                    if(searcher(findUser.followers) == true || findTweet.user == req.user.sub){
                                        Tweet.findByIdAndUpdate(text[1], {$push:{likes: req.user.username}}, {new: true}, (err, tweetUpdated)=>{
                                            if(err){
                                                res.status(500).send({message: 'Error desconocido en el servidor al realizar acción'});
                                            } else if(tweetUpdated){
                                                res.status(200).send({message: 'La operación ha sido exitosa!, le ha gustado el tweet:',
                                                                    id: tweetUpdated._id, user: tweetUpdated.user, dateTweet: tweetUpdated.dateTweet, tweet: tweetUpdated.text,
                                                                    likes: tweetUpdated.likes.length, replies: tweetUpdated.replies.length, retweets: tweetUpdated.retweets.length});
                                            } else{
                                                res.status(500).send({message: 'No se ha podido realizar la acción, intente más tarde'});
                                            }
                                        });
                                    } else{
                                        res.status(403).send({message: 'No puede dar like a un tweet de un usuario que no esta siguiendo'});
                                    }
                                } else {
                                    res.status(404).send({message: 'El usuario no existe en la base de datos'});
                                }
                            });
                        } else {
                            res.status(403).send({message: 'No puede realizar esta acción dos veces en el mismo tweet'});
                        }
                    } else {
                        res.status(404).send({message: 'El tweet al que desea reaccionar no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede realizar esta acción, primero inicie sesión'});
            }
        break;
        case 'DISLIKE':
            if(req.headers.authorization){
                Tweet.findById(text[1], (err, findTweet)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                    } else if(findTweet){
                        if(searcher(findTweet.likes) == true){
                            Tweet.findByIdAndUpdate(text[1], {$pull:{likes: req.user.username}}, {new: true}, (err, tweetUpdated)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al realizar acción'});
                                } else if(tweetUpdated){
                                    res.status(200).send({message: 'La operación ha sido exitosa!, ha dejado de reaccionar al tweet:',
                                                          id: tweetUpdated._id, user: tweetUpdated.user, dateTweet: tweetUpdated.dateTweet, tweet: tweetUpdated.text,
                                                        likes: tweetUpdated.likes.length, replies: tweetUpdated.replies.length, retweets: tweetUpdated.retweets.length});
                                } else{
                                    res.status(500).send({message: 'No se ha podido realizar la acción correctamente, intente más tarde'});
                                }
                            });
                        } else{
                            res.status(403).send({message: 'No puede dar dislike a este tweet, primero debe reaccionar'});
                        }
                    } else {
                        res.status(404).send({message: 'El tweet al que desea dejar de reaccionar no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede realizar esta acción, primero inicie sesión'});
            }
        break;
        case 'REPLY':
            if(req.headers.authorization){
                Tweet.findById(text[1], (err, findTweet)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                    } else if(findTweet){               
                        if(saveText(text, 2) != "" && saveText(text, 2).length <= 150){
                            var repl = req.user.username + ": " + saveText(text, 2);
                            Tweet.findByIdAndUpdate(text[1], {$push:{replies: repl}}, {new: true}, (err, tweetUpdated)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al responder tweet', err});
                                } else if(tweetUpdated){
                                    res.status(200).send({message: 'La operación ha sido exitosa', id: tweetUpdated._id, user: tweetUpdated.user,
                                                        dateTweet: tweetUpdated.dateTweet,text: tweetUpdated.text, likes: tweetUpdated.likes.length,
                                                        replies: tweetUpdated.replies});
                                } else{
                                    res.status(404).send({message: 'No se ha podido completar la acción'});
                                }
                            });
                        } else{
                            if(saveText(text, 2).length > 150){
                                res.status(403).send({message: 'Su respuesta excede el numero de caracteres permitidos'});
                            } else{
                                res.status(403).send({message: 'Ingrese el texto de su respuesta correctamente por favor'});
                            }
                        }
                    } else{
                        res.status(404).send({message: 'El tweet al que desea responder no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede responder a este tweet, primero inicie sesión'});
            }
        break;
        case 'RETWEET':
            if(req.headers.authorization){
                Tweet.findById(text[1], (err, findTweet)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                    } else if(findTweet){
                        if(searcher(findTweet.retweets) == false){
                            User.findById(findTweet.user, (err, findUser)=>{
                                if(err){
                                    res.status(500).send({mesage: 'Error desconocido en el servidor al buscar usuario'});
                                } else if(findUser){
                                    tweet.text = findTweet.text;
                                    tweet.dateTweet = date;
                                    tweet.user = req.user.sub;
                                    tweet.commentTweet = saveText(text, 2);
                                    tweet.sourceInformation = findUser.username + ' ' + findTweet.dateTweet;

                                    tweet.save((err, saveTweet)=>{
                                        if(err){
                                            res.status(500).send({mesage: 'Error desconocido en el servidor al guardar tweet'});
                                        } else if(saveTweet){
                                            Tweet.findByIdAndUpdate(findTweet._id, {$push:{retweets: req.user.username}}, {new:true}, (err, tweetUpdated)=>{
                                                if(err){
                                                    res.status(500).send({mesage: 'Error desconocido en el servidor al actualizar tweet'});
                                                } else if(tweetUpdated){
                                                    res.status(200).send({mesage: 'Ha compartido el tweet de ' + findUser.username, Tweet: saveTweet});
                                                } else{
                                                    res.status(500).send({mesage: 'No se ha podido completar la operación, intente mas tarde'});
                                                }
                                            });
                                        } else {
                                            res.status(500).send({mesage: 'No se ha podido completar la operación, intente mas tarde'});
                                        }
                                    });
                                } else{
                                    res.status(404).send({mesage: 'No se ha podido encontrar al usuario'});
                                }
                            });
                        } else{
                            User.findById(findTweet.user, (err, findUser)=>{
                                if(err){
                                    res.status(500).send({mesage: 'Error desconocido en el servidor al buscar usuario'});
                                } else if(findUser){
                                    Tweet.findOneAndRemove({sourceInformation: findUser.username + ' ' + findTweet.dateTweet, user: req.user.sub}, (err, findTweetAndDelete)=>{
                                        if(err){
                                            res.status(500).send({message: 'Error desconocido en el servidor al eliminar tweet'});
                                        } else if(findTweetAndDelete){
                                            Tweet.findByIdAndUpdate(findTweet._id, {$pull:{retweets: req.user.username}}, {new:true}, (err, tweetUpdated)=>{
                                                if(err){
                                                    res.status(500).send({mesage: 'Error desconocido en el servidor al actualizar tweet'});
                                                } else if(tweetUpdated){
                                                    res.status(200).send({mesage: 'Se ha eliminado el tweet correctamente'});
                                                } else{
                                                    res.status(500).send({mesage: 'No se ha podido completar la operación, intente mas tarde'});
                                                }
                                            });
                                        } else{
                                            res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                        }
                                    });
                                } else{
                                    res.status(404).send({mesage: 'No se ha podido encontrar al usuario'});
                                }
                            });
                        }
                    } else{
                        res.status(404).send({message: 'El tweet que desea compartir no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede realizar esta acción, primero inicie sesión'});
            }
        break;
        case 'FOLLOW':
            if(req.headers.authorization){
                User.findOne({username: text[1]}, (err, findUser)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                    } else if(findUser){
                        if(searcher(findUser.followers) == false && req.user.username != text[1]){                        
                            User.findByIdAndUpdate(req.user.sub, {$push:{following: text[1]}}, {new: true}, (err, following)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al intentar seguir usuario'});
                                } else if(following){
                                    User.findOneAndUpdate({username: text[1]}, {$push:{followers: req.user.username}}, {new: true}, (err, follower)=>{
                                        if(err){
                                            res.status(500).send({message: 'Error desconocido en el servidor al intentar seguir usuario'});
                                        } else if(follower){
                                            res.status(200).send({message: 'Usted empezó a seguir a ' + findUser.username});
                                        } else{
                                            res.status(400).send({message: 'No se obtuvieron los datos necesarios'});
                                        }
                                    });
                                } else{
                                    res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                }
                            });
                        } else if(searcher(findUser.followers) == true && req.user.username != text[1]){
                            res.status(403).send({message: 'Usted ya sigue al usuario ' + findUser.username + ', no puede realizar esta acción'});
                        } else if(req.user.username == text[1]){
                            res.status(403).send({message: 'No puede realizar esta acción sobre usted'});
                        }
                    } else{
                        res.status(404).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede seguir a un usuario, primero inicie sesión'});
            }
        break;
        case 'UNFOLLOW':
            if(req.headers.authorization){
                User.findOne({username: text[1]}, (err, findUser)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                    } else if(findUser){
                        if(searcher(findUser.followers) == true){
                            User.findByIdAndUpdate(req.user.sub, {$pull:{following: text[1]}}, {new: true}, (err, findUser)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                                } else if(findUser){
                                    User.findOneAndUpdate({username: text[1]}, {$pull:{followers: req.user.username}}, {new: true}, (err, updateUser)=>{
                                        if(err){
                                            res.status(500).send({message: 'Error desconocido en el servidor al actualizar usuiario'});
                                        } else if(updateUser){
                                            res.status(200).send({message: 'Usted ya no sigue a ' + updateUser.username});
                                        } else{
                                            res.status(400).send({message: 'No se obtuvieron los datos necesarios'});
                                        }   
                                    });
                                } else{
                                    res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                }
                            });
                        } else{
                            res.status(403).send({message: 'No esta siguiendo al usuario ' + text[1] + ', no puede realizar esta acción'})
                        }
                    } else{
                        res.status(404).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede realizar esta acción, primero inicie sesión'});
            }
        break;
        case 'PROFILE':
            if(req.headers.authorization){
                User.findOne({username: text[1]}, (err, findUser)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                    } else if(findUser){
                        res.status(200).send({mesage: 'Este es el perfil del usuario ' + findUser.username, Nombre_Completo: findUser.name, 
                                            Email: findUser.email, Followers: findUser.followers.length, Following: findUser.following.length});
                    } else{
                        res.status(404).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede ver el perfil de ' + text[1] + ', primero inicie sesión'});
            }
        break;
        case 'LOGIN':
            User.findOne({$or:[{email: text[1]}, {username: text[1]}]}, (err, findUser)=>{
                if(err){
                    res.status(500).send({message: 'Error desconocido en el servidor al iniciar sesión'});
                } else if(findUser){
                    bcrypt.compare(text[2], findUser.password, (err, successful)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al comparar contraseñas'});
                        } else if(successful){
                                res.send({token: jwt.createToken(findUser), user: findUser.name});
                        } else{
                            res.status(200).send({message: 'Contraseña incorrecta'});
                        }
                    });
                } else{
                    res.status(404).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
                }
            });
        break;
        case 'REGISTER':
            if(text.length == 6){
                User.findOne({$or:[{username: text[3]}, {email: text[4]}]}, (err, findUser)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al registrar usuario'});
                    } else if(findUser){
                        res.status(200).send({message: 'El username y/o correo ya existen en la base de datos'});
                    } else{
                        if(text[5].length >= 8){
                            if(text[4].includes('@') == true){
                                user.name = text[1] + ' ' + text[2];
                                user.username = text[3];
                                user.email = text[4];
                                bcrypt.hash(text[5], null, null, (err, passwordHash)=>{
                                    if(err){
                                        res.status(500).send({message: 'Error desconocido en el servidor al encriptar contraseña'});
                                    } else if(passwordHash){
                                        user.password = passwordHash;
                                        user.save((err, saveUser)=>{
                                            if(err){
                                                res.status(500).send({message: 'Error desconocido en el servidor al guardar usuario'});
                                            } else if(saveUser){
                                                res.status(200).send({message: 'Bienvenido a Twitter <(^o^)>', saveUser});
                                            } else{
                                                res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                            }
                                        });
                                    } else{
                                        res.status(418).send({message: 'Error inesperado!!'});
                                    }
                                });                            
                            } else if(text[3].includes('@') == false){
                                res.status(400).send({message: 'La dirección de correo no es válida'});
                            }
                        } else{
                            res.status(400).send({message: 'La contraseña debe tener como mínimo 8 caracteres'});
                        }
                    }
                });
            } else{
                res.status(400).send({message: 'Por favor utilice el siguiente formato: Nombre Apellido Username Email Password'});
            }
        break;
        default:
            res.status(200).send({message: 'El comando que ingresó no es válido'});
        break;
    }
}

module.exports = {
    commands
}
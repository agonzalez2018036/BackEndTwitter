'use strict'

var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');

function commands(req, res){
    var user = new User();
    var tweet = new Tweet();
    var fecha = new Date();
    var params = req.body.commands;
    var text = params.split(' ');
    var command = text[0];

    switch(command){
        case 'ADD_TWEET':
            if(req.headers.authorization){
                let textTweetAdd = "";
                for(var i = 1; i < text.length; i++){
                    if(i < (text.length-1)){
                        textTweetAdd = textTweetAdd + text[i] + " ";
                    } else{
                        textTweetAdd = textTweetAdd + text[i];
                    }
                }

                if(textTweetAdd != "" && textTweetAdd.includes('  ') == false && textTweetAdd.length <= 150){
                    tweet.text = textTweetAdd;
                    tweet.dateTweet = fecha.toUTCString();
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
                    if(textTweetAdd.length > 150){
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
                            res.status(403).send({message: 'No posees permisos para eliminar este tweet'});
                        }
                    } else{
                        res.status(404).send({message: 'El tweet que desea eliminar no existe'});
                    }
                });
            } else{
                res.status(400).send({message: 'No puede eliminar un tweet, primero inicie sesión'});
            }
        break;
        case 'EDIT_TWEET':
            if(req.headers.authorization){
                var textTweetEdit = "";
                for(let i = 2; i < text.length; i++){
                    if(i < (text.length-1)){
                        textTweetEdit = textTweetEdit + text[i] + " ";
                    } else{
                        textTweetEdit = textTweetEdit + text[i];
                    }
                }

                if(textTweetEdit != "" && textTweetEdit.includes('  ') == false && textTweetEdit.length <= 150){
                    Tweet.findById(text[1], (err, findTweet)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al buscar tweet'});
                        } else if(findTweet){
                            if(findTweet.user == req.user.sub){
                                Tweet.findByIdAndUpdate(text[1], {text: textTweetEdit}, {new: true}, (err, updateTweet)=>{
                                    if(err){
                                        res.status(500).send({message: 'Error desconocido en el servidor al actualizar tweet'});
                                    } else if(updateTweet){
                                        res.status(200).send({message: 'El tweet se actualizó correctamente', updateTweet});
                                    } else{
                                        res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                    }
                                });
                            } else{
                                res.status(403).send({message: 'No posees permisos para editar este tweet'});
                            }
                        } else {
                            res.status(400).send({message: 'El tweet que desea editar no existe'});
                        }
                    });
                } else{
                    if(textTweetEdit.length > 150){
                        res.status(403).send({message: 'Su tweet excede el numero de caracteres permitidos'});
                    } else{
                        res.status(403).send({message: 'No se puede publicar un tweet vacío'});
                    }
                }
            } else{
                res.status(403).send({message: 'No puede actualizar tweets, primero inicie sesión'});
            }
        break;
        case 'VIEW_TWEETS':
            if(req.headers.authorization){
                if(text.length == 1){
                    Tweet.find({}, (err, findTweets)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al ver tweets'});
                        } else if(findTweets){
                            if(findTweets.length == 0){
                                res.status(200).send({message: 'No hay tweets en la base de datos'});     
                            } else{
                                res.status(200).send({message: findTweets});
                            }
                        } else{
                            res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                        }
                    });
                } else if(text.length == 2){
                    User.findOne({username: text[1]}, (err, findUser)=>{
                        if(err){
                            res.status(500).send({message: 'Error desconocido en el servidor al comprobar existencia'});
                        } else if(findUser){
                            Tweet.find({user: findUser._id}, (err, findTweets)=>{
                                if(err){
                                    res.status(500).send({message: 'Error desconocido en el servidor al ver tweets'});
                                } else if(findTweets){
                                    if(findTweets.length == 0){
                                        res.status(200).send({message: 'El usuario ' + findUser.username + ' no tiene tweets'});     
                                    } else{
                                        res.status(200).send({message: findTweets});
                                    }
                                } else{
                                    res.status(404).send({message: 'No se obtuvieron los datos necesarios'});
                                }
                            });
                        } else{
                            res.status(404).send({message: 'No existe el usuario ' +  text[1]});
                        }
                    });
                } else{
                    res.status(404).send({message: 'No se encontraron concidencias'});
                }
            } else{
                res.status(403).send({message: 'No puede ver tweets, primero inicie sesión'});
            }
        break;
        case 'FOLLOW':
            if(req.headers.authorization){
                User.findOne({username: text[1]}, (err, findUser)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                    } else if(findUser){
                        var followedUser = false;
                        for(var i = 0; i < findUser.followers.length; i++){
                            if(findUser.followers[i] == req.user.username){
                                followedUser = true;
                                i = findUser.followers.length;
                            }
                        }

                        if(followedUser == false && req.user.username != text[1]){                        
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
                        } else if(followedUser == true && req.user.username != text[1]){
                            res.status(403).send({message: 'Usted ya sigue al usuario ' + findUser.username + ', no puede realizar esta acción'});
                        } else if(req.user.username == text[1]){
                            res.status(403).send({message: 'No puede realizar esta acción sobre usted'});
                        }
                    } else{
                        res.status(404).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede seguir a alguien, primero inicie sesión'});
            }
        break;
        case 'UNFOLLOW':
            if(req.headers.authorization){
                User.findOne({username: text[1]}, (err, findUser)=>{
                    if(err){
                        res.status(500).send({message: 'Error desconocido en el servidor al buscar usuario'});
                    } else if(findUser){
                        var findFollower = false;
                        for(var i = 0; i < findUser.followers.length; i++){
                            if(findUser.followers[i] == req.user.username){
                                findFollower = true;
                                i = findUser.followers.length;
                            }
                        }

                        if(findFollower == true){
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
                        res.status(400).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
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
                        res.status(200).send('Nombre del usuario: ' + findUser.name + '\n' +
                                             'Username:           ' + findUser.username + '\n' +
                                             'Email:              ' + findUser.email + '\n' +
                                             'Seguidores:         ' + findUser.followers.length + '\n' +
                                             'Siguiendo:          ' + findUser.following.length);
                    } else{
                        res.status(404).send({message: 'El usuario ' + text[1] + ' no existe en la base de datos'});
                    }
                });
            } else{
                res.status(403).send({message: 'No puede ver el perfil de ' + text[1] + ' primero inicie sesión'});
            }
        break;
        case 'LOGIN':
            User.findOne({$or:[{email: text[1]}, {username: text[1]}]}, (err, findUser)=>{
                if(err){
                    res.status(500).send({message: 'Error general al iniciar sesión'});
                } else if(findUser){
                    bcrypt.compare(text[2], findUser.password, (err, successful)=>{
                        if(err){
                            res.status(500).send({message: 'Error general al comparar contraseñas'});
                        } else if(successful){
                                res.send({token: jwt.createToken(findUser), user: findUser.name});
                        } else{
                            res.status(200).send({message: 'Contraseña incorrecta'});
                        }
                    });
                } else{
                    res.status(404).send({message: 'El usuario no existe en la base de datos'});
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
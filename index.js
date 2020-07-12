'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;


mongoose.connect('mongodb://localhost:27017/DBTwitter', {useNewUrlParser:true, useUnifiedTopology: true})
    .then(()=>{
        console.log('Se ha establecido una conexión con la base de datos');
        app.listen(port, ()=>{
            console.log('El servidor de express esta corriendo', port);
            console.log('\n Notas:')
            console.log('-Los parámetros del comando REGISTER son: Nombre, Apellido, Username, Email y Contraseña');
            console.log('-El commando VIEW_TWEETS sin parametros muestra todos los tweets');
        });
    }).catch(err=>{
        console.log('No se ha podido establecer una conexión con la base de datos');
    });

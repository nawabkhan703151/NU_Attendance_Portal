const mongoose = require('mongoose');

const connection =mongoose.createConnection('mongodb://localhost:27017/NuAttendancePortal').on(
    'open',()=>{
    console.log('Mongodb is connected Successfully');
}).on('error',()=>{
    console.log('Mongodb is Not Connectec Error');
});
 module.exports=connection;

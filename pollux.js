global.Promise = require('bluebird');
const cfg = require('./config.json');
const colors = require('colors');
const fs = require('fs');

let {Client} =require("discord.js")
const POLLUX = new Client({
    messageCacheMaxSize: 4048,
    messageCacheLifetime: 1680,
    messageSweepInterval: 2600,
    disableEveryone: true,
    fetchAllMembers: false,
    disabledEvents: ['typingStart', 'typingStop', 'guildMemberSpeaking']
});
POLLUX.login(cfg.token).then(loginSuccess)


//GEARBOX | Boilerplate functions provider.
const gearbox= require("./core/gearbox.js");



//Translation Engine ------------- <
const i18next = require('i18next');
const multilang = require('./utils/multilang_b');
const i18n_backend = require('i18next-node-fs-backend');
const backendOptions = {
    loadPath: './locales/{{lng}}/{{ns}}.json',
    addPath: './locales/dev/translation.json',
    jsonIndent: 2
};
gearbox.getDirs('./locales/', (list) => {
    i18next.use(i18n_backend).init({
        backend: backendOptions,
        lng: 'en',
      fallbackLng:"en",
        preload: list,
        load: 'all'
    }, (err, t) => {
        if (err) {
            console.log(err)
        }
        multilang.setT(t);
    });
});
//----------------[i18n END]-------<


//=======================================//
//      BOT EVENT HANDLER
//=======================================//

async function loginSuccess() {
  console.log('LOGGED IN!'.bgGreen.white.bold)
  console.log('Starting up Shard '+(1+POLLUX.shard.id)+'/'+POLLUX.shard.count);
  POLLUX.user.setStatus('dnd')
};


fs.readdir("./eventHandlers/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    delete require.cache[require.resolve(`./eventHandlers/${file}`)];
    let eventor = require(`./eventHandlers/${file}`);
    let eventide = file.split(".")[0];
    POLLUX.on(eventide, (...args) => eventor.run(gear,DB,userDB,POLLUX, ...args));
  });
});


//=======================================//
//      PROCESS EVENT HANDLER
//=======================================/*/

process.on('unhandledRejection', function(reason, p){

    console.log("\n\n==================================")
    console.log("Possibly Unhandled Rejection at: Promise \n".red,p, "\n\n reason: ".red, reason.stack);
    console.log("==================================\n\n")
   // gear.sendSlack("Promise Breaker","Promise Rejection: "+reason,reason.stack,"#ffcd25" )

});

process.on('uncaughtException', function (err) {

    console.log("\n\n==================================")
    console.log('EXCEPTION: \n' + err);
    console.log(err.stack);
    console.log("==================================\n\n")
    //process.exit(1);

});
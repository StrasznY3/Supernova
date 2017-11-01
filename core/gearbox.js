const fs=require('fs');
const paths = require("./paths.json");



const Canvas = require("canvas");
const Pixly = require("pixel-util");
const wrap = require('canvas-text-wrapper').CanvasTextWrapper;


//DATABASE --(sepparate this later)
const Schemas = require('./schemas.js');

const userDB    = Schemas.user;
const serverDB  = Schemas.server;
const channelDB = Schemas.channel;

userDB.new = function(obj){
  return new Promise(async resolve=>{
    let instance = new userDB;
    instance.id=obj.id;
    instance.tag=obj.tag;
    instance.name=obj.username;
    instance.save(function(e){
      if(e)throw "Database Save Failed";
      else resolve(userDB.findOne({id:obj.id}));
    });
  });
};
serverDB.new = function(obj){
  return new Promise(async resolve=>{
    let instance = new serverDB;
    instance.id=obj.id;
    instance.name=obj.name;
    instance.channels=obj.channels.map(ch=>ch.id);
    instance.save(function(e){
      if(e)throw "Database Save Failed";
      else resolve(serverDB.findOne({id:obj.id}));
    });
  });
};
channelDB.new = function(obj){
  return new Promise(async resolve=>{
    let instance = new channelDB;
    instance.id=obj.id;
    instance.server=obj.guild.id;
    instance.name=obj.name;
    instance.save(function(e){
      if(e)throw "Database Save Failed";
      else resolve(channelDB.findOne({id:obj.id}));
    });
  });
};

const set = function(query,alter){
  if(['string','number'].includes(typeof query)){
    query = {'id':query.toString()};
  };
  if(!typeof alter) throw "Invalid Alter Object";
  return this.findOneAndUpdate(query,alter);
};

userDB.set    = set;
serverDB.set  = set;
channelDB.set = set;

const DB=serverDB //legacy
//--DB END ------


module.exports={
  DB:serverDB, //legacy
  serverDB:serverDB,
  userDB:userDB,
  channelDB:channelDB,

//Get Index List
  getDirs : function getDirs(rootDir, cb) {
    fs.readdir(rootDir, function (err, files) {
        let dirs = [];
        for (let i = 0; i < files.length; ++i) {
            let file = files[i];
            if (file[0] !== '.') {
                let filePath = rootDir + '/' + file;
                fs.stat(filePath, function (err, stat) {
                    if (stat.isDirectory()) {
                        dirs.push(this.file);
                    }
                    if (files.length === (this.index + 1)) {
                        return cb(dirs);
                    }
                }.bind({
                    index: i,
                    file: file
                }));
            }
        }
    })
 },


  //Get IMG from Channel MSGs
  getImg: async function getImg(message) {
    if (message.attachments.url && message.attachments.width) return message.attachments.url;
    let sevmesgs = message.channel.messages;

    const messpool = sevmesgs.filter(mes => {
      try {
        if (mes.attachments) {
          if (mes.attachments.first().url) {
            return true
          }
        }
      } catch (e) {
        return false
      }
    });
    if (messpool.last()) return messpool.last().attachments.first().url;
    else return undefined
  },

  //-------------------------------------------------------------[CANVAS FUNCTIONS]
  //Readfile >> Canvas
  getCanvas: async function getCanvas(path) {
    let img = await new Canvas.Image;
    img.src = await Pixly.createBuffer(path).then(buff => {
      return buff;
    });
    return img;
  },

  //> Canvas Text Block
   block: async function block(base, text, font, color, W, H, options) {

     font = font || '14px Product,Sans'
     color = color || '#b4b4b4'
     base.font = font;
     W = W || 300;
     H = H || 200;
     const item = new Canvas(W, H);
     let c = item.getContext("2d");
     //c.antialias = 'subpixel';
     //c.filter = 'best';
     c.font = font;
     c.fillStyle = color;
     options = options || {
       font: font || "bold 25px Arial, sans-serif",
       textAlign: "left",
       verticalAlign: "top",
       lineBreak: "auto",
     };

     await wrap(item, text, options);
     return {item: item,height: H,width: W}; // <-- i think H and W are redundant, need to check later

   },

  //> Canvas Text Tag
   tag: async function tag(base, text, font, color) {

            font = font || '14px Product,Sans'
            color = color || '#b4b4b4'
            base.font = font;

            let H = base.measureText(text).emHeightAscent
            let h = base.measureText(text).emHeightDescent;
            let w = base.measureText(text).width;
            const item = new Canvas(w, h + H);
                let c = item.getContext("2d")
                //c.antialias = 'subpixel';
                //c.filter = 'best';
                c.font = font;
                c.fillStyle = color;
                await c.fillText(text, 0, H);
            return {item:item,height:h+H,width:w};// <-- same as above
        },
  //-------------------------------------------------------------[CANVAS END]


  //> Wait in Seconds
    wait: async function wait(time){
      time = typeof time == 'number' ?  time : 1000;
      return new Promise(resolve => {
          setTimeout(() => {
            resolve(true);
          },
          time*1000||1000);
      });
    },

    miliarize: function miliarize(numstring,strict){
        if (typeof numstring == "number"){
            numstring = numstring.toString();
        };
        if(numstring.length < 4)return numstring;
        //-- -- -- -- --
        let stashe = numstring.replace(/\B(?=(\d{3})+(?!\d))/g, ".").toString();
        // Gibe precision pls
        if(strict){
            let stash = stashe.split(".")
        switch(stash.length){
            case 1:
                return stash;
            case 2:
                if(stash[1]!="000") break;
                return stash[0]+"K";
            case 3:
                if(stash[2]!="000") break;
                return stash[0]+"."+stash[1][0]+stash[1][1]+"Mi";
            case 4:
                if(stash[3]!="000") break;
                return stash[0]+"."+stash[1][0]+stash[1][1]+"Bi";
             }
            return stashe;
        };
        // Precision is not a concern
        stash = stashe.split(".")
        switch(stash.length){
            case 1:
                return stash.join(" ");
            case 2:
                if(stash[0].length<=1) break;
                return stash[0]+"K";
            case 3:
                return stash[0]+"Mi";
            case 4:
                return stash[0]+"Bi";
             }
         return stashe;
    },


  //===============[ARCH PIPES]===================//
    usage: function usage(cmd, m, third) {
      delete require.cache[require.resolve("./archetypes/usage.js")];
      let usage = require("./archetypes/usage.js");
      return usage.run(cmd, m, third);
    },
     dropGoodies: function (a, b, c) {
       delete require.cache[require.resolve("./archetypes/drops.js")];
       let drops = require("./archetypes/drops.js");
       return drops.runb(a, b, c);
     },
  //===============[pipes-end]===================//





    sendLog: function sendLog(args){
      //PLES
      let P = args.payload;
      let L = args.logType;
      let E = args.event;
      let S = args.server;

      serverDB.findOne({id:S.id}).then(DBDATA=>{
          if(!DBDATA)return;
          if (DBDATA.logs[L][E]===false)return;
          delete require.cache[require.resolve("./modules/dev/log.js")];
          let logger = require("./modules/dev/log.js");
          logger.init(E,L,S,DBDATA,P);
        }).catch(e=>{
        console.log("===========LOG ERROR==============");
        console.log(S);
        console.log('----------');
        console.log(e);
        console.log("==================================");
        //serverDB.findOneAndUpdate({_id:sv.id},{$set:{logs:def.logItems}}) <== fuck
        });
    },

  //==============[LEGACY (Pollux v3/v4 "RubyRuby/Meido" Cogs)]=============//

    sendLog_legacy: function sendLog_legacy(eve,logtype,sv,DB,extra,alt,arg,nise){
      console.warn("Deprecation warning: This is a Legacy Function")
      try{
        DB.findOne({_id:sv.id}).then(DBDATA=>{
          if(!DBDATA)return;
          if (DBDATA.logs[logtype][eve]==false)return;
      delete require.cache[require.resolve("./modules/dev/log.js")]
          let a = require("./modules/dev/log.js")
        a.init(eve,logtype,sv,DBDATA,extra,alt,arg,nise)
        }).catch(e=>{

        console.log("=============ERROR================")
        console.log(sv)
        console.log(e)
        console.log("==================================")

        DB.findOneAndUpdate({_id:sv.id},{$set:{logs:def.logItems}})
        })
      }catch(e){
        try{
          //require("./functions.js").run("normalize",sv,{def_type:"gdfal",parma:"logs"})
        }catch(e){

        }
      }

    },
    checkGoods: function checkGoods(amount, invoker) {
      console.warn("Deprecation warning: This is a Legacy Function")
      try{

        if (invoker.dDATA.modules.rubines >= amount) {
            return true;
        } else {
            return false;
        }
      }catch(e){
        console.log("problem with dDATA on invoker")
         userDB.findOne({id:invoker.id}).then(DDTA=>{
           if(DDTA.modules.rubines >= amount) return true;
            else return false
      });
      }
    },
    hasPerms:   function hasPerms(Member, DB) {
        console.warn("Deprecation warning: This is a Legacy Function")
        if(Member.id =="88120564400553984" ) return true;
        let Server = Member.guild
        let modPass;
        if(Server.dDATA.modules.MODROLE){
            modPass = Member.roles.has(Server.dDATA.modules.MODROLE);
        }
        if (Server.owner.id === Member.id || Member.hasPermission("ADMINISTRATOR")) {
            modPass = true;
        };
        if (Member.hasPermission("MANAGE_GUILD")) {
            modPass = true;
        };
        return modPass;
    },
    updatePerms: function updatePerms(tgt, Server, DaB) {
      try {

        switch (true) {
          case Server.member(tgt).id == Server.ownerID:
            return 0;
            break;
          case Server.member(tgt).hasPermission("ADMINISTRATOR"):
          case Server.member(tgt).hasPermission("MANAGE_GUILD"):
            return 1;
            break;
          case Server.member(tgt).hasPermission("KICK_MEMBERS"):
          case Server.member(tgt).hasPermission("MANAGE_CHANNELS"):
            return 2;
            break;
          default:
            return 3;
            break;
        };

        serverDB.findOne({
          _id: Server.id
        }).then(SDATA=>{
          if (SDATA.modules.MODROLE) {
            if (Server.member(tgt).roles.has(Server.dDATA.modules.MODROLE)) {
              return 2;
            }
          }
        });
      } catch (e) {
        console.log(e)
      };
    },


  //===============[LEGACY (Pollux Zero/1.0 "Arturia/Falk" Cogs)]==============//
      getFlair: function getFlair(origin, target) {
        console.warn("Deprecation warning: This is a Legacy Function");
        try {

            let modRole = origin.guild.roles.find("name", "MOD");
            let admRole = origin.guild.roles.find("name", "ADM");
            let maidRole = origin.guild.roles.find("name", "🎀   Maids");

            if (origin.guild.member(target).roles.has(admRole.id)) {
                return "ADM";
            } else if (origin.guild.member(target).roles.has(modRole.id)) {
                return "MOD";
            } else if (origin.guild.member(target).roles.has(maidRole.id)) {
                return "MAID";
            } else if (target.bot) {
                return "BOT";
            } else {
                return "none";
            }
        } catch (err) {

            if (target.id == origin.guild.owner.id) return "ADM";
            if (origin.guild.member(target).hasPermission("ADMINISTRATOR")) return "ADM";
            if (origin.guild.member(target).hasPermission("MANAGE_GUILD")) return "MOD";
            if (origin.guild.member(target).hasPermission("KICK_MEMBERS")) return "MOD";
            if (target.bot) return "BOT";
            return "none"
        }
    },
      glassify: function glassify(img, call, msg = false) {
          console.warn("Deprecation warning: This is a Legacy Function");
            Jimp.read(img).then(function (user) {

                Jimp.read(paths.BUILD + "glass.png").then(function (glass) {
                    Jimp.read(paths.BUILD + "note.png").then(function (lenna) {

                        user.resize(126, 126)
                        user.mask(glass, 0, 0)
                        var air = {}
                        Jimp.read(paths.BUILD + "note.png").then(function (lennaB) {
                            lennaB.composite(user, 0, 0)
                            lennaB.mask(lenna, 0, 0)

                            //lennaB.write(`${paths.GLASS}/${call}.png`);
                            //log("Glassify Done")
                        });
                    });
                })
            });
        },
      shuffle:  function shuffle(array) {
        console.warn("Deprecation warning: This is a Legacy Function")
        var currentIndex = array.length,
            temporaryValue, randomIndex;
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },

}
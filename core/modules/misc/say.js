const cmd = 'say';
const init = function (message) {
  message.delete().catch()
 message.channel.send(message.content.split(/ +/).slice(1).join(' '))
}
 module.exports = {
    pub:true,
    cmd: cmd,
    perms: 3,
    init: init,
    cat: 'misc'
};

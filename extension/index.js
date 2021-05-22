const fs = require('fs');
const Speaker = require('speaker');
const AudioMixer = require('audio-mixer')
const Discord = require('discord.js');
const command = require('./commands');

let silence, connection, guild;

module.exports = function(nodecg) {

	let memberList = nodecg.Replicant('memberList', { persistent: false });
	let currentMembers = [];
	memberList.value = [];
	connection = undefined

	let roleID = nodecg.bundleConfig.roleID;

	let mixer = new AudioMixer.Mixer({
		channels: 2,
		bitDepth: 16,
		sampleRate: 48000,
	});

	const client = new Discord.Client();
	client.once('ready', () => {
		nodecg.log.info('DACBot is now online. For help, type @' + client.user.username + ' help')

		command(client, 'help', roleID, (message) => {
			const helpEmbed = new Discord.MessageEmbed()
				.setTitle("DACBot Help")
				.setURL("https://github.com/nicnacnic/DACBot")
				.setDescription("Does someone need some help?")
				.addField("Connecting to a Voice Channel", "<@" + client.user.id + "> connect\nThe bot will connect to the voice channel that the user is in and start capturing audio.")
				.addField("Disconnecting from a Voice Channel", "<@" + client.user.id + "> disconnect\nThe bot will stop capturing audio and disconnect from the voice channel.")
				.setThumbnail(client.user.displayAvatarURL())
				.setFooter("DACBot made by nicnacnic")
				.setTimestamp()
			message.channel.send(helpEmbed);
		})
		command(client, 'connect', roleID, (message) => {
			if (connection !== undefined)
				message.reply(`I\'m already in a voice channel! Please disconnect me first.`)
			else if (message.member.voice.channel !== undefined && message.member.voice.channel !== null) {
				guild = message.member.guild.id;
				record(message.member.voice.channel.id);
				message.channel.send('Connected to `' + message.member.voice.channel.name + '`.')
			}
			else
				message.reply(`you're not in a voice channel!`)
		})
		command(client, 'disconnect', roleID, (message) => {
			if (connection !== undefined) {
				message.channel.send('Disconnected from `' + connection.channel.name + '`.')
				stopRecording(connection.channel.name);
			}
			else
				message.reply(`I'm not in a voice channel!`)
		});
		command(client, 'log', roleID, (message) => {
			nodecg.log.warn(currentMembers);
			nodecg.log.warn(connection);
			});

		client.on('guildMemberSpeaking', (member, speaking) => {
			for (let i = 0; i < memberList.value.length; i++) {
				if (memberList.value[i].id === member.id) {
					if (speaking == 1)
						memberList.value[i].speaking = true;
					else
						memberList.value[i].speaking = false;
					break;
				}
			}
		});

		client.on('voiceStateUpdate', (oldMember, newMember) => {
			if (connection !== undefined && newMember.serverMute !== oldMember.serverMute || newMember.serverDeaf !== oldMember.serverDeaf || newMember.selfMute !== oldMember.selfMute || newMember.selfDeaf !== oldMember.selfDeaf) {
				for (let i = 0; i < memberList.value.length; i++) {
					if (memberList.value[i].id === newMember.id) {
						if (newMember.serverMute || newMember.serverDeaf || newMember.selfMute || newMember.selfDeaf)
							memberList.value[i].muted = true;
						else
							memberList.value[i].muted = false;
					}
				}
			}
			else if (connection !== undefined && newMember.id !== client.user.id) {
				if (oldMember.channelID !== connection.channel.id && newMember.channelID === connection.channel.id) {
					let userVolume = 100;
					let i = currentMembers.length;
					currentMembers.push({ id: newMember.id, audio: '', mixer: '' })
					currentMembers[i].audio = connection.receiver.createStream(currentMembers[i].id, { mode: 'pcm', end: 'manual' });
					currentMembers[i].mixer = mixer.input({
						volume: userVolume
					});
					currentMembers[i].audio.pipe(currentMembers[i].mixer);
					let muteState;
					if (newMember.serverMute)
						muteState = true;
					else
						muteState = newMember.selfMute;
					memberList.value.push({ id: newMember.id, name: newMember.member.user.username, avatar: newMember.member.user.displayAvatarURL(), muted: muteState, speaking: false, volume: userVolume })
				}
				else if (oldMember.channelID === connection.channel.id && newMember.channelID !== connection.channel.id) {
					for (let i = 0; i < currentMembers.length; i++) {
						if (currentMembers[i].id === oldMember.id) {
							currentMembers.splice(i, 1)
							break;
						}
					}
					for (let i = 0; i < memberList.value.length; i++) {
						if (memberList.value[i].id === oldMember.id) {
							memberList.value.splice(i, 1);
							break;
						}
					}
				}
			}
			else if (oldMember.id === client.user.id && oldMember.channelID !== null) {
				if (newMember.channelID === null)
					stopRecording(oldMember.channel.name);
				else if (oldMember.channelID !== newMember.channelID && connection !== undefined) {
					let channelID = newMember.channelID;
					stopRecording(oldMember.channel.name);
					setTimeout(function() { record(channelID); }, 500);
				}
			}
		})
		nodecg.listenFor('changeVolume', (value) => {
			for (let i = 0; i < currentMembers.length; i++) {
				if (currentMembers[i].id === value.id) {
					currentMembers[i].mixer.setVolume(value.value);
					break;
				}
			}
		})
	});
	async function record(channelID) {
		connection = await client.channels.cache.get(channelID).join();

		const speaker = new Speaker({
			channels: 2,
			bitDepth: 16,
			sampleRate: 48000,
			device: nodecg.bundleConfig.outputDevice
		});
		let userVolume = 100;
		if (client.channels.cache.get(channelID).members.size > 1) {
			client.channels.cache.get(channelID).members.forEach((member) => {
				if (member.user.id !== client.user.id) {
					currentMembers.push({ id: member.user.id, audio: '', mixer: '' });

					if (member.voice.selfMute || member.voice.selfDeaf || member.voice.serverMute || member.voice.serverDeaf)
						memberList.value.push({ id: member.user.id, name: member.user.username, avatar: member.user.displayAvatarURL(), muted: true, speaking: false, volume: userVolume });
					else
						memberList.value.push({ id: member.user.id, name: member.user.username, avatar: member.user.displayAvatarURL(), muted: false, speaking: false, volume: userVolume });
				}
			})
			for (let i = 0; i < currentMembers.length; i++) {
				currentMembers[i].audio = connection.receiver.createStream(currentMembers[i].id, { mode: 'pcm', end: 'manual' });
				currentMembers[i].mixer = mixer.input({
					volume: userVolume
				});
				currentMembers[i].audio.pipe(currentMembers[i].mixer);
			}

			mixer.pipe(speaker);
		}

		silence = setInterval(function() {
			connection.play(fs.createReadStream('./bundles/nodecg-dacbot/sounds/silence.ogg'), { type: 'ogg/opus', volume: 0.1 });
		}, 270000)

		nodecg.log.info('Capture started for channel ' + connection.channel.name + ' on ' + Date());
		return;
	}
	function stopRecording(channelName) {
		if (connection !== undefined) {
			nodecg.log.info('Capture stopped for channel ' + channelName + ' on ' + Date())
			connection.channel.leave();
		}
		currentMembers = [];
		memberList.value = [];
		connection = undefined;
		clearInterval(silence)
	}
	client.login(nodecg.bundleConfig.botToken);
};
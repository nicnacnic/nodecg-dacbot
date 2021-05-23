const memberList = nodecg.Replicant('memberList');
const addMember = nodecg.Replicant('addMember');
const removeMember = nodecg.Replicant('removeMember')
const changeMute = nodecg.Replicant('changeMute')
const speaking = nodecg.Replicant('speaking')

NodeCG.waitForReplicants(memberList, addMember, removeMember, changeMute, speaking).then(() => {

	memberList.value.forEach(function (element) {
		createElement(element);
	});

	addMember.on('change', (newVal, oldVal) => {
		if (oldVal !== undefined && newVal !== null) {
			createElement(newVal);
		}
	});

	removeMember.on('change', (newVal, oldVal) => {
		if (oldVal !== undefined && newVal !== null && document.getElementById(newVal) !== null)
			document.getElementById(newVal).remove();
	});

	changeMute.on('change', (newVal, oldVal) => {
		if (nodecg.bundleConfig.hideMutedUsers && oldVal !== undefined && newVal !== null) {
			if (newVal.muted)
				document.getElementById(newVal.id).style.display = 'none';
			else
				document.getElementById(newVal.id).style.display = 'inline-block'
		}
	});

	speaking.on('change', (newVal, oldVal) => {
		if (oldVal !== undefined && newVal !== null) {
			if (newVal.speaking)
				document.getElementById('img' + newVal.id).style.borderColor = '#43B581';
			else
				document.getElementById('img' + newVal.id).style.borderColor = 'transparent';
		}
	})
});

function createElement(element) {
	let main = document.getElementById('main');
	let div = document.createElement('div');
	div.setAttribute('id', element.id);
	div.setAttribute('class', 'div');
	if (nodecg.bundleConfig.hideMutedUsers && element.muted)
		div.style.display = 'none'
	else
		div.style.display = 'inline-block';

	let img = document.createElement('img');
	img.setAttribute('src', element.avatar);
	img.setAttribute('id', 'img' + element.id)
	img.setAttribute('class', 'userImage')
	img.style.borderColor = 'transparent'

	let name = document.createElement('div');
	name.setAttribute('class', 'userName')
	name.innerHTML = element.name

	div.appendChild(img);
	div.appendChild(name);
	main.appendChild(div);
}
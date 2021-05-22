const memberList = nodecg.Replicant('memberList');

NodeCG.waitForReplicants(memberList).then(() => {

	memberList.on('change', (newVal, oldVal) => {
		let array = newVal;
		if (oldVal === undefined) {
			array.forEach((element) => {
				createElement(element);
				if (nodecg.bundleConfig.hideMutedUsers && element.muted)
						document.getElementById(element.id).style.display = 'none'
			});
		}
		else if (oldVal !== undefined && newVal.length !== oldVal.length) {
			let join = newVal.filter(obj => oldVal.every(s => s.id !== obj.id));
			let left = oldVal.filter(obj => newVal.every(s => s.id !== obj.id));
			if (join.length > 0) {
				for (let i = 0; i < join.length; i++) {
					if (nodecg.bundleConfig.hideMutedUsers) {
						if (!join[i].muted)
							createElement(join[i]);
					}
					else
						createElement(join[i])
				}
			}
			if (left.length > 0) {
				for (let i = 0; i < left.length; i++) {
					document.getElementById(left[i].id).remove();
				}
			}
		}
		else {
			let speaking = newVal.filter(obj => oldVal.every(s => s.speaking !== obj.speaking));
			let muted = newVal.filter(obj => oldVal.every(s => s.muted !== obj.muted));
			if (speaking.length > 0) {
				for (let i = 0; i < speaking.length; i++) {
					if (speaking[i].speaking)
						document.getElementById(speaking[i].id).querySelector('.userImage').style.borderColor = '#43B581';
					else
						document.getElementById(speaking[i].id).querySelector('.userImage').style.borderColor = 'transparent';
				}
			}
			if (muted.length > 0 && nodecg.bundleConfig.hideMutedUsers) {
				for (let i = 0; i < muted.length; i++) {
					if (muted[i].muted)
						document.getElementById(muted[i].id).style.display = 'none'
					else
						document.getElementById(muted[i].id).style.display = 'inline-block'
				}
			}
		}
	});
})

function createElement(element) {
	let main = document.getElementById('main');
	let div = document.createElement('div');
	div.setAttribute('id', element.id);
	div.setAttribute('class', 'div');

	let img = document.createElement('img');
	img.setAttribute('src', element.avatar);
	img.setAttribute('id', 'img')
	img.setAttribute('class', 'userImage')
	img.style.borderColor = 'transparent'

	let name = document.createElement('div');
	name.setAttribute('class', 'userName')
	name.innerHTML = element.name

	div.appendChild(img);
	div.appendChild(name);
	main.appendChild(div);
}
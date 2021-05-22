const memberList = nodecg.Replicant('memberList');

NodeCG.waitForReplicants(memberList).then(() => {

	memberList.on('change', (newVal, oldVal) => {
		let array = newVal;
		if (oldVal === undefined) {
			array.forEach((element) => {
				createElement(element);
			});
		}
		else if (oldVal !== undefined && newVal.length !== oldVal.length) {
			let join = newVal.filter(obj => oldVal.every(s => s.id !== obj.id));
			let left = oldVal.filter(obj => newVal.every(s => s.id !== obj.id));
			if (join.length > 0) {
				for (let i = 0; i < join.length; i++) {
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
			let volumeChanged = newVal.filter(obj => oldVal.every(s => s.volume !== obj.volume));
			if (volumeChanged.length > 0) {
				for (let i = 0; i < volumeChanged.length; i++) {
					document.getElementById(volumeChanged[i].id).querySelector('.labelValue').innerHTML = volumeChanged[i].volume + '%';
				}
			}
		}
	});
})

function createElement(element) {
	let main = document.getElementById('main');
	let sliderContainer = document.createElement("div");
	sliderContainer.setAttribute('id', element.id)
	sliderContainer.setAttribute("class", "sliderContainer");

	let label = document.createElement("div");
	label.setAttribute("class", "name");
	label.innerHTML = element.name;

	let labelValue = document.createElement("span");
	labelValue.setAttribute("id", "label");
	labelValue.setAttribute("class", "labelValue");
	labelValue.innerHTML = element.volume + '%';

	let sliderDiv = document.createElement("div");
	sliderDiv.setAttribute("class", "sliderDiv");

	let slider = document.createElement("paper-slider");
	slider.setAttribute("id", 'slider');
	slider.setAttribute("class", "slider");
	slider.setAttribute("min", "0");
	slider.setAttribute("max", "100");
	slider.setAttribute("value", element.volume);
	slider.setAttribute("onChange", 'changeVolume(\'' + element.id + '\', this.value)')

	label.appendChild(labelValue);
	sliderDiv.appendChild(slider);
	sliderContainer.appendChild(label);
	sliderContainer.appendChild(sliderDiv);

	main.appendChild(sliderContainer);
}

function changeVolume(element, value) {
	nodecg.sendMessage('changeVolume', {
		id: element,
		value: value
	})
	for (let i = 0; i < memberList.value.length; i++) {
		if (memberList.value[i].id === element) {
			memberList.value[i].volume = value;
			break;
		}
	}
}
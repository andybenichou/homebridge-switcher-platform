let Characteristic, Service
const stateManager = require('../lib/stateManager')

class Lights {
	constructor(switcher, switcherInfo, platform) {
		Service = platform.api.hap.Service
		Characteristic = platform.api.hap.Characteristic
		
		this.switcher = switcher
		this.log = platform.log
		this.api = platform.api
		this.id = switcherInfo.device_id
		this.ip = switcherInfo.device_ip
		this.name = switcherInfo.name
		this.serial = this.id
		this.model = switcherInfo.type
		this.manufacturer = 'Switcher'
		this.type = 'Lights'
		this.displayName = this.name
		this.state = switcherInfo.state
		this.processing = false

		this.UUID = this.api.hap.uuid.generate(this.id)
		this.accessory = platform.accessories.find(accessory => accessory.UUID === this.UUID)

		if (!this.accessory) {
			this.log(`Creating New Switcher  (${this.type}) Accessory: "${this.name}"`)
			this.accessory = new this.api.platformAccessory(this.name, this.UUID)
			this.accessory.context.type = this.type
			this.accessory.context.deviceId = this.id

			platform.accessories.push(this.accessory)
			// register the accessory
			this.api.registerPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, [this.accessory])
		} else {
			this.log(`Switcher "${this.name}" (${this.id}) is Connected!`)
			this.accessory.context.type = this.type
		}

		this.accessory.context.ip = this.ip

		let informationService = this.accessory.getService(Service.AccessoryInformation)

		if (!informationService)
			informationService = this.accessory.addService(Service.AccessoryInformation)

		informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial)

		
		this.addSwitchService(1)
		if (this.model === 'sl02') 
			this.addSwitchService(2)	
		else if (this.model === 'sl03') {
			this.addSwitchService(2)
			this.addSwitchService(3)
		}
	}


	addSwitchService(index) {
		this.log.easyDebug(`Adding Switch ${index} service for "${this.name}"`)
		this[`SwitchService${index}`] = this.accessory.getService(`Light${index}`)
		if (!this[`SwitchService${index}`])
			this[`SwitchService${index}`] = this.accessory.addService(Service.Switch, `Light${index}`, `Light${index}`)


		this[`SwitchService${index}`].getCharacteristic(Characteristic.On)
			.on('set', stateManager.set.MixedOn.bind(this, index))
			.updateValue(this.state[`light${index}_power`] === 'ON')
			
	}

	updateState(state) {
		this.state = state

		for (let i = 1; i < 4; i++) {
			if (this.state[`light${i}_power`])
				this[`SwitchService${i}`].getCharacteristic(Characteristic.On)
					.updateValue(this.state[`light${i}_power`] === 'ON')
		}
	}
}


module.exports = Lights
const { NOW_REGION, PUPPETEER_EXECUTABLE_PATH } = process.env
const NOW_DEV = NOW_REGION == 'dev1'

const log = (level: string, msg: string, obj?: object) => {
	// log everything in dev environment
	if (NOW_DEV || (level == 'FATAL' || level == 'ERROR')) {
		obj ? console.log(`[${level}] ${msg}`, obj) : console.log(`[${level}] ${msg}`)
	}
}

const logger = {
	info: (msg: string, obj?: object) => {
		log('INFO', msg, obj)
	},
	warn: (msg: string, obj?: object) => {
		log('WARN', msg, obj)
	},
	error: (msg: string, obj?: object) => {
		log('ERROR', msg, obj)
	},
	fatal: (msg: string, obj?: object) => {
		log('FATAL', msg, obj)
	},
}

export default logger

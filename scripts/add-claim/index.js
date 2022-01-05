const admin = require('firebase-admin')
admin.initializeApp()

const args = process.argv.slice(2)
const userId = args[0]

if (!userId) {
  console.error('Missing user ID\nUsage: node index.js <userId>')
  process.exit(1)
}

if (userId.length != 28) {
  console.error('Invalid userId - must be 28 characters long')
  process.exit(1)
}

return admin
  .auth()
  .setCustomUserClaims(userId, {
    stripeRole: 'pro',
  })
  .then(() => {
    console.log('Done!')
  })
  .catch(error => {
    console.log(error)
  })

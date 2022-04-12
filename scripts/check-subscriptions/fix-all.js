const fs = require('fs')
const csv = require('fast-csv')
const path = require('path')
const admin = require('firebase-admin')

admin.initializeApp()

const args = process.argv.slice(2)
const file = args[0]

// Retrieve all user ids from the ignore csv file
const ignore = fs
  .readFileSync('ignore.csv', 'utf-8')
  .split('\n') // split lines
  .slice(1) // remove header 
  .map(line => line.split(',')[0]) // Get the user id

if (!file) {
  console.error(
    'Missing Stripe customer file\nUsage: node update.js <stripe-export.csv>'
  )
  process.exit(1)
}

const stats = {}
const proUsers = []

fs.createReadStream(path.resolve(__dirname, file))
  .pipe(csv.parse({ headers: true }))
  .on('error', error => console.error(error))
  .on('data', row => {
    const userId = row['firebaseUID (metadata)']
    const status = row['Status']
    const email = row['Email']
    if (!stats[status]) {
      stats[status] = 1
    } else {
      stats[status]++
    }
    // TODO: Only push users who have a card registered.
    proUsers.push({ userId, email, status })
  })
  .on('end', async rowCount => {
    console.log(`Parsed ${rowCount} rows. Stats:`, stats)
    console.log(proUsers.length)
    let i = 0
    for (const { userId, email, status } of proUsers) {
      // Ignore promotional users
      if (ignore.has(userId)) {
        continue
      }
      const user = await admin.auth().getUser(userId)
      // Check if the user has a pro claim in firebase but has no active or
      // trialing status in stripe
      if (
        user.customClaims &&
        user.customClaims.stripeRole === 'pro' &&
        !['active', 'trialing'].includes(status)
      ) {
        console.log(
          `User ${userId} (${email}) has pro claim in Firebase,`,
          `but the status in Stripe is '${status}'`
        )
        // console.log(userId, email, status)
        fs.appendFileSync(
          'data/result-2.txt',
          `${userId}, ${email}, ${status}\n`
        )
        // Remove the claim from Firebase.
        await admin.auth().setCustomUserClaims(userId, {})
      }
      i += 1
      console.log(i)
    }
  })

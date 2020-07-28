const express = require("express")
const bodyParser = require("body-parser")
const request = require("request")
const https = require("https")

const app = express()
const port = 3000

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

// Users mail chimp settings.
const settings = {

    // Mailchimp User account/details.
    audienceId: "<audience id>",
    apiKey: "<api key>",
    userName: "<username>",
    serverId: "server id", // Last characters of API key after the '-'

    // api http request options.
    get options() {
        return {
            method: "POST",
            auth: this.userName + ":" + this.apiKey
        }
    },

    // Mail chimp api url.
    get url() {
        return "https://" + this.serverId + ".api.mailchimp.com/3.0/lists/" + this.audienceId
    },
}

// Create a new member object and return a JSON string.
function createSubscriber(req) {
    return JSON.stringify({
        members: [
            {
                email_address: req.body.email,
                status: "subscribed",
                merge_fields: {
                    FNAME: req.body.firstName,
                    LNAME: req.body.lastName
                }
            }
        ]
    })
}

// Check and log and errors that may occour when adding a new member.
function checkErrors(data) {
    let errors = JSON.parse(data)
    if (errors.error_count === 0) {
        console.log("Success: New member added")
    } else {
        for (i = 0; i < errors.error_count; i++) {
            console.log(errors.errors[i])
        }
    }
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/signup.html")
})

app.post("/", (req, res) => {
    const newSubscriber = createSubscriber(req)

    const url = settings.url
    const options = settings.options

    const request = https.request(url, options, (response) => {

        if (response.statusCode === 200) {
            res.sendFile(__dirname + "/success.html")
        } else {
            res.sendFile(__dirname + "/failure.html")
        }

        response.on("data", (data) => {
            checkErrors(data)
        })
    })

    // Send JSON data to mail chimp server
    request.write(newSubscriber)

    // End request.
    request.end()
})

// Redirect error/failure back to home route.
app.post("/failure", (req, res) => res.redirect("/"))

// Listen on 'port' for connections.
app.listen(port, () => console.log(`Server running on port: ${port}`))
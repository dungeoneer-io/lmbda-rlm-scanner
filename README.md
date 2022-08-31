# lmda-rlm-scanner
Obtains snapshots, harvests unique entities, and generates entity events for: Connected Realms and Realms

### What to Have
- Blizzard API Developer Account and API Key+Secret
- AWS Account, Access to create Lambda Functions
- Github Account to deploy and use Github Actions
- Mongo database, write access connection string

### What Happens?
- Connects to Blizzard API and retrieves Connected Realm index
- Requests info on each Connected Realm in index (~83)
- Raw CRealm information bundled into snapshot and stored
- Unique Connected Realms are upserted into Mongo database
- Unique Realms (nested inside of Connected Realms) are upserted into Mongo database
- Newly inserted Connected Realms and Realms have Entity Events created, logging the first appearance of the entity

### Resource Usage
Lambda Function Using:
- 128MB Memory (~100MB used)
- Billable Duration over 83 Crealms: 9111 ms

### Plugging into the Cloud
- Deploy to github to leverage GitHub Actions written in .github\workflows
- Add projects secrets to github repo `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Will need to have a named lambda function already created by the name in deploy yml. `lmda-rlm-scanner` here
- Pre-made lambda is going to need environment variables on board, also make local uncommitted .env with those same values. It'll make sure local runs work

```
ZEPHYR_BLIZZDATA_MONGO_CONSTRING="VALUEHERE"
ZEPHYR_BLIZZARD_API_KEY="VALUEHERE"
ZEPHYR_BLIZARD_API_SECRET="VALUEHERE"
```
- Pre-made lambda timeout increased to like 15 seconds

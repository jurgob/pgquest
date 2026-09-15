import * as age from "age-encryption";

const identity = await age.generateIdentity();
const recipient = await age.identityToRecipient(identity);

console.log(`PGQUEST_SOPS_AGE_KEY=${identity}`);
console.log(`# Public recipient: ${recipient}`);

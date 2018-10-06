/**
 * Request access from other user.
 * @param {org.alpha.secureid.RequestAccess} requestAccess - the RequestAccess transaction
 * @transaction
 */
function requestAccess(requestAccess) {
    console.log('Request Access');

    var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getIdentifier() != requestAccess.from.getIdentifier()) {
        throw new Error('You are not authorized to make this transaction');
    }

    var NS = 'org.alpha.secureid';
    var factory = getFactory();

    var reqTransaction = factory.newConcept(NS, 'AccessTransaction');
    reqTransaction.txId = requestAccess.getIdentifier();
    reqTransaction.status = "NOT_RESPONDED";
    reqTransaction.otherUserId = requestAccess.from.getIdentifier();

    var sentTransaction = factory.newConcept(NS, 'AccessTransaction');
    sentTransaction.txId = requestAccess.getIdentifier();
    sentTransaction.status = "NOT_RESPONDED";
    sentTransaction.otherUserId = requestAccess.to.getIdentifier();

    requestAccess.from.history.sent.push(sentTransaction);
    requestAccess.to.history.received.push(reqTransaction);

    return getAssetRegistry(NS + '.AccessHistory')
        .then(function(assetRegistry) {
            return assetRegistry.update(requestAccess.to.history);
        }).then(function() {
            return getAssetRegistry(NS + '.AccessHistory');
        }).then(function(assetRegistry) {
            return assetRegistry.update(requestAccess.from.history);
        }).then(function(){
            return 'Successfully requested';
        });
}

/**
 * Update the status of an order
 * @param {org.alpha.secureid.RejectAccess} rejectAccess - the RejectAccess transaction
 * @transaction
 */
function rejectAccess(rejectAccess) {
    console.log('Reject Access')

    var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getIdentifier() != rejectAccess.from.getIdentifier()) {
        throw new Error('You are not authorized to make this transaction');
    }

    var NS = 'org.alpha.secureid';
    var factory = getFactory();

  	var txId = rejectAccess.reqTxnId;
  	var requested = 0;
  	for (var i=0; i<rejectAccess.from.history.received.length; i++){
      	if (rejectAccess.from.history.received[i].txId === txId){
          	rejectAccess.from.history.received[i].status = "REJECTED";
          	requested = 1;
        }
    }
  	if (requested == 0){
      	throw new Error("You are not authorized to make this transaction");
    }
  	for (var i=0; i<rejectAccess.to.history.sent.length; i++){
      	if (rejectAccess.to.history.sent[i].txId === txId){
          	rejectAccess.to.history.sent[i].status = "REJECTED";
        }
    }

    return getAssetRegistry(NS + '.AccessHistory')
        .then(function(assetRegistry) {
            return assetRegistry.update(rejectAccess.to.history);
        }).then(function() {
            return getAssetRegistry(NS + '.AccessHistory');
        }).then(function(assetRegistry) {
            return assetRegistry.update(rejectAccess.from.history);
        }).then(function(){
            return 'Successfully rejected';
        });
}

/**
 * Update the status of an order
 * @param {org.alpha.secureid.GrantAccess} grantAccess - the grantAccess transaction
 * @transaction
 */
function grantAccess(grantAccess) {
    console.log('Grant Access')

  	var currentParticipant = getCurrentParticipant();
    if (currentParticipant.getIdentifier() != grantAccess.from.getIdentifier()) {
        throw new Error('You are not authorized to make this transaction');
    }

    var NS = 'org.alpha.secureid';
    var factory = getFactory();

  	var txId = grantAccess.reqTxnId;
  	var requested = 0;
  	for (var i=0; i<grantAccess.from.history.received.length; i++){
      	if (grantAccess.from.history.received[i].txId === txId){
          	grantAccess.from.history.received[i].status = "GRANTED";
          	requested = 1;
        }
    }
  	if (requested == 0){
      	throw new Error("You are not authorized to make this transaction");
    }
  	for (var i=0; i<grantAccess.to.history.sent.length; i++){
      	if (grantAccess.to.history.sent[i].txId === txId){
          	grantAccess.to.history.sent[i].status = "GRANTED";
        }
    }
    var currentUser = getCurrentParticipant();
  	currentUser.grantedUsers.push(grantAccess.to.userId);
    return getAssetRegistry(NS + '.AccessHistory')
        .then(function(assetRegistry) {
            return assetRegistry.update(grantAccess.to.history);
        }).then(function() {
            return getAssetRegistry(NS + '.AccessHistory');
        }).then(function(assetRegistry) {
            return assetRegistry.update(grantAccess.from.history);
        }).then(function(){
            return getParticipantRegistry(NS + '.User');
        }).then(function(participantRegistry){
      		console.log(currentUser);
      		return participantRegistry.update(currentUser);
    	}).then(function(){
      		return 'Successfully granted';
    });
}

/**
 * Update the status of an order
 * @param {org.alpha.secureid.ViewAadhaar} viewAadhaar - the ViewAadhaar transaction
 * @transaction
 *
 **/
function viewAadhaar(viewAadhaar) {
    console.log('View Aadhaar')

  	if (viewAadhaar.to.grantedUsers.indexOf(getCurrentParticipant().getIdentifier()) === -1){
        throw new Error("You are not authorized to access this document");
	}

    var NS = 'org.alpha.secureid';
    return getAssetRegistry(NS + '.Aadhaar')
  		.then(function(assetRegistry){
      		return assetRegistry.get(viewAadhaar.to.getIdentifier())
    });
}

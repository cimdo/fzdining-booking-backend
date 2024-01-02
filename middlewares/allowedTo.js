const { userDB } = require("../data");

const allowedTo = (roles) =>{
    return (req, res, next) => {
        const currentUser = userDB.find(u => u.id === req.user.id);
        if(currentUser) {
            if(!roles.includes(currentUser.accountType)) {
                return res.sendStatus(403);
                return;
            }
            next();
        }
        next();

    }
}

module.exports = allowedTo;
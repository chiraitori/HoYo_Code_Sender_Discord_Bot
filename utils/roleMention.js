'use strict';

function getRoleMention(roleId) {
    if (!roleId) {
        return {
            content: '',
            allowedMentions: { roles: [] }
        };
    }

    return {
        content: `<@&${roleId}>`,
        allowedMentions: { roles: [roleId] }
    };
}

module.exports = {
    getRoleMention
};

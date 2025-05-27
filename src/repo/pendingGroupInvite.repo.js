import PendingGroupInvite from "../models/pendingGroupInvite.model.js";

export const createInvite = (data) => {
  return PendingGroupInvite.create(data);
};

export const findInviteById = (id) => {
  return PendingGroupInvite.findById(id);
};

export const saveInvite = (invite) => {
  return invite.save();
};

export const deleteInvite = (invite) => {
  return invite.deleteOne();
};

export const findInvitesByGroupId = (groupId) => {
  return PendingGroupInvite.find({ groupId })
    .populate("invitedUser", "fullName avatar")
    .populate("invitedBy", "fullName avatar");
};

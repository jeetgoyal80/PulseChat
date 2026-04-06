exports.getCloudinaryPublicId = (imageUrl) => {
  if (!imageUrl) return null;

  const parts = imageUrl.split('/');
  const filenameWithExt = parts.pop();
  const folder = parts.pop();

  const filename = filenameWithExt.split('.')[0];

  return `${folder}/${filename}`;
};

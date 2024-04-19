import FileBrowser from "@/app/_components/file-browser";

const FavoritesPage = () => {
  return (
    <>
      <FileBrowser title="Trash" deletedOnly={true} />
      <div className="flex justify-center mt-12 font-bold truncate">All files marked for deletion will be permanently removed from the trash on the first day of every month at 8:00 AM PST.</div>
    </>
  );
};

export default FavoritesPage;

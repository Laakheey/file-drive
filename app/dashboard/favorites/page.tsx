import FileBrowser from '@/app/_components/file-browser'

const FavoritesPage = () => {
  return (
    <>
        <FileBrowser title='Favorites' favorites={true}/>
    </>
  )
}

export default FavoritesPage
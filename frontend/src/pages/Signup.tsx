import {Auth} from '../components/Auth'
import { Quotes } from '../components/Quotes'

export const Signup = () => {
  return (
    <div className='flex'>
        <div className="w-1/2">
            <Auth type={'signup'}/>
        </div>
        <div className="w-1/2 invisible lg:visible">
            <Quotes/>
        </div>
    </div>
  )
}

import Raster from '@/entities/Raster'
import {firestore} from '@/plugins/firebase'
import {collection, getDocs} from 'firebase/firestore'

export class RasterAPI {
  async get_rasters() {
    let rasters = await getDocs(collection(firestore, 'rasters'))
    console.log(rasters.docs)
    return rasters.docs.map((doc) => doc.data() as Raster)
  }
}

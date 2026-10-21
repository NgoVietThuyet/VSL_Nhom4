import { Injectable } from '@angular/core';
import { CommonService } from '../../../shared/services';
import { GisDataCategoryDto, GisLocationDto } from '../models/gis-location.model';

@Injectable({ providedIn: 'root' })
export class GisService {
    constructor(private common: CommonService) { }

    search(params: GisLocationDto) { return this.common.get('GisLocation/Search', params); }
    searchSilent(params: GisLocationDto) { return this.common.get('GisLocation/Search', params, false); }
    getById(id: string) { return this.common.get(`GisLocation/GetById/${id}`, {}); }
    create(data: GisLocationDto) { return this.common.post('GisLocation/Create', data); }
    update(data: GisLocationDto) { return this.common.put('GisLocation/Update', data); }
    delete(id: string) { return this.common.delete(`GisLocation/Delete/${id}`, {}); }
    geoJson(params: GisLocationDto) { return this.common.get('GisLocation/GeoJson', params); }
    getCategories() { return this.common.get('GisLocation/GetCategories', {}); }
    heatmap(params: GisLocationDto) { return this.common.get('GisLocation/Heatmap', params); }

    categoryGetAll() { return this.common.get('GisDataCategory/GetAll', {}); }
    categorySearch(params: GisDataCategoryDto) { return this.common.get('GisDataCategory/Search', params); }
    categoryCreate(data: GisDataCategoryDto) { return this.common.post('GisDataCategory/Create', data); }
    categoryUpdate(data: GisDataCategoryDto) { return this.common.put('GisDataCategory/Update', data); }
    categoryDelete(id: string) { return this.common.delete(`GisDataCategory/Delete/${id}`, {}); }
}

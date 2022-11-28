import {  } from '@sitecore-discover/data'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of, BehaviorSubject, from } from 'rxjs'
import { tap, catchError, finalize, map } from 'rxjs/operators'
import { ActivatedRoute, Router } from '@angular/router'
import { } from '@sitecore-discover/core'
import { } from '@sitecore-discover/common'
import { } from '@sitecore-discover/widgets'
import { ApplicationInsightsService } from '../application-insights/application-insights.service'
import { TokenHelperService } from '../token-helper/token-helper.service'
import { AppConfig } from 'src/app/models/environment.types'
import { RouteService } from '../route/route.service'
import { HSLineItem, HSProduct } from "@ordercloud/headstart-sdk";

import {
  ListArgs,
  HSOrder,
  SuperHSMeProduct,
  HSMeProduct,
} from '@ordercloud/headstart-sdk'
import { includes } from 'lodash'
import { Window } from 'selenium-webdriver';
declare var rfk: { uid: Function,push:Function };

@Injectable({
    providedIn: 'root',
  })
  export class ReflektionService {
    constructor(
      private appConfig: AppConfig,
      private http: HttpClient,
      private router: Router,
      //private routeService: RouteService
    ) 
    {}
    /*async buildHeaders(): Observable<HttpHeaders> {
      const key = await this.getAccessToken()
      return new HttpHeaders({
        Authorization: `Bearer ${key}`,
      })
    }*/
    /*
    createHttpParams(args: ListArgs): HttpParams {
      let params = new HttpParams()
      Object.entries(args).forEach(([key, value]) => {
        if (key !== 'filters' && value) {
          params = params.append(key, value.toString())
        }
      })
      Object.entries(args.filters).forEach(([key, value]) => {
        if ((typeof value !== 'object' && value) || (value && value.length)) {
          params = params.append(key, value.toString())
        }
      })
      return params
    }*/
    buildFilters(facet) {
      const filterKeys = Object.keys(facet)
      let filter = {}
      filterKeys.forEach((key, index) =>{
        if(key.startsWith("xp.Facets.price")){
          const tmpArr = facet["xp.Facets.price"].split('|')
          const values = tmpArr.map(item => {
            const range = item.split(' - ')
            return {min: +range[0], max: +range[1] }
          })
          filter['price'] = {value: values}
        }
        else if(key.startsWith("xp.Facets")) {
          const keyName = key.split(".")[2]
          const values = facet[key].split("|")
          filter[keyName] = {value : values}
        }
      })
      return filter
    }
    buildReflektionSearchRequest(args: ListArgs, i?, userID?, keyphraseMax?, categoryMax?, n_item?) {
      const {
        search,
        sortBy,
        page,
        filters    
      } = args
      const payload = {
        "data":{
          "n_item": +n_item || 20,
          "page_number": +page || 1,
          "query":{"keyphrase":{"value":[search || ""]}},
          "widget":{"rfkid":"rfkid_7"},
          "suggestion":{"keyphrase":{"max": +keyphraseMax || 1},
          "category":{"max": +categoryMax || 0}},
          "request_for":["query"],
          "context":{
            "user": {
              "user_id": userID ? userID : undefined,
              "uuid": rfk.uid()
            }
          },
          "sort":{"value":[]},
          "facet":{"all":true},
          "filter":{
            "all_category_ids":{"value":[]},
            ...this.buildFilters(filters)
          },
          "content":{"product":{}},
          "force_v2_specs":true
        }
      }
      return payload;

    }
	// Replace id with Customer key
    async searchReflektion(args: ListArgs, i?, userID?, keyphraseMax?, categoryMax?, n_item?): Promise<any> {
      const url = `https://api.rfksrv.com/search-rec/id/3`
      const body = this.buildReflektionSearchRequest(args, i, userID, keyphraseMax, categoryMax, n_item);
      const tokens = await this.getAccessToken();
      const token = tokens.accessToken;
      var headers_object = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      const httpOptions = {
        headers: headers_object
      };
      return await this.http
        .post<any>(url, body, httpOptions)
        .toPromise()
        
    }
    async searchPreviewProducts(searchStr: string, userId: string) {
      return this.searchReflektion(
        {
          search: searchStr,
          sortBy: null,
          page: null,
          filters: {}
        }, null, userId, 6, 6, 6)
    }
	// Replace xxxx with API key
    async getAccessToken(): Promise<any> {
      const url:string = 'https://api.rfksrv.com/account/1/access-token'
      var headers_object = new HttpHeaders({
        'x-api-key': 'xxxx'
      });
  
      const httpOptions = {
        headers: headers_object
      };
      return await this.http.post<any>(url, {}, httpOptions).toPromise()
     
    }
    mapMeta(result) {
      
        const page_number = result.page_number
          , page_size = result.content.product.n_item
          , total_count = result.content.product.total_item
          , start_range = (page_number - 1) * page_size + 1
          , max_range = Math.max(start_range + page_size, total_count);
          
        return {
            Facets: result.facet && this.mapFacets(result.facet),
            Page: page_number,
            PageSize: page_size,
            TotalCount: total_count,
            TotalPages: result.total_page,
            ItemRange: [start_range, max_range]
        }
    
    }
    mapProduct(product) {
      return {
        ID: product.sku,
        Name: product.name,
        QuantityMultiplier: 1,
        PriceSchedule: {
            Name: "",
            MinQuantity: 1,
            PriceBreaks: [{
                Quantity: 1,
                Price: Number(product.final_price)
            }]
        },
        xp: {
            Currency: "USD",
            Images: [{
                Url: product.image_url
            }]
        }
      }
    }
    mapFacets(facet){
      const facetNames: string[] = ['genders', 'size', 'price']
      let Facet = []
      Object.keys(facet).forEach(key => {
        if (facetNames.includes(key)) {
            const tempObj = {
              Name: facet[key].display_name,
              XpPath: `Facets.${key}`, 
              Values: facet[key].value.map(item =>{
                return { Value: item.text, Count: item.count }
              })
            }
            Facet.push(tempObj)
        } 
      });
      return Facet
    }
    getUrl(id) {
      return this.appConfig.baseUrl + "/products/" + id
  }

  trackReflectionEvent(type: string, name: string, data: any): void {
  
    rfk.push(["trackEvent", {
      type: type,
      name:name,
      value: data
    }])
  }
  trackAddToCart = function (type: string, data: any) {
    this.trackReflectionEvent("a2c", type, {
      products: [{
        sku: data.ProductID,
        price: data.UnitPrice,
        quantity: data.Quantity
      }]
    })
  }


  trackProductView = function (type: string, data: any) {
    this.trackReflectionEvent("view", type,
      //{
      //products: 
      // {
      //    sku: data.ID
      //  }
      
      //}
      {
        context: {
          page: {
            uri: this.router.url,
            title: data.Name,
            referrer: "https://www.google.com/"

          }
        },
        products:
          [{
          sku: data.ID
       }]

     
      }
    )
  }

  trackUserLogin = function (data: any) {
    this.trackReflectionEvent("user", "login", {
      context: {
        user: {
          id: data.ID,
          email: data.Email
        }
      }
    })
  }
  private MapProductFromLi(lineItem: HSLineItem){
    return {
      sku: lineItem.Product.ID,
      quantity: lineItem.Quantity,
      price: lineItem.LineTotal,
      price_original: lineItem.UnitPrice      
    }
  }
  trackOrderSubmit = function (data: any, lineItems: HSLineItem[]) {
    var n = data.FromUser;
      
    let products = lineItems.map(this.MapProductFromLi);
    this.trackReflectionEvent("order", "confirm", {
      context: {
        user: {
          id: n.ID,
          email: n.Email,
          address: data.BillingAddress
        }
      },
      products: products,
      checkout: {
        order_id: data.ID,
        subtotal: data.Subtotal,
        total: data.Total
      }
    })
  }
// Replace id with Customer key
  async getProductDetailWidgetData(productID: string, userId: string): Promise<any> {
    const url = `https://api.rfksrv.com/search-rec/id/3`
    const body = this.buildReflektionSimilarProductRequest(productID, userId)
    const tokens = await this.getAccessToken()
    const token = tokens.accessToken
    var headers_object = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const httpOptions = {
      headers: headers_object
    };
    const result = await this.http
      .post<any>(url, body, httpOptions)
      .toPromise()
    let transformResponse = {}
    result.batch.forEach((item) => {
      transformResponse[item.widget.rfkid] = item.content.product.value.map(this.mapProduct.bind(this))
     
    })
    return transformResponse;
  }

  buildReflektionSimilarProductRequest(productId:string, userId: string){
    const payloadSP= {
      data: {
        batch: [{
          widget: {
              rfkid: "hs-frequently-bought-together"
          }
        }, {
          widget: {
              rfkid: "hs-similar-products"
          }
        }],
        context: {
          page: {
              sku: [productId]
          },
          user: {
              uuid: rfk.uid(),
              userID: userId? userId : undefined
          }
        },
        content: {
          product: {}
        }
      }
    }
    return payloadSP;
  }
  buildHomePagePayload(userId: string){
    return {
      data: {
        context: {
            user: {
                uuid: rfk.uid(),
                userID: userId? userId : undefined
            }
        },
        batch: [
          {
            widget: {
                rfkid: 'hs-homepage-top-products'
            }
          }, 
          {
            widget: {
                rfkid: 'hs-homepage-herobanner'
            }
          }
        ],
        content: {
          product: {}
        },
        appearance: {
          templates: {
            sections: ["html", "css", "js"],
            devices: ["pc"]
          }
        }
      }
    }
  }
  
  // Replace id with Customer key
  async getHomePageWidgetData(userId: string) {
    const url = `https://api.rfksrv.com/search-rec/id/3`
    const payload = this.buildHomePagePayload(userId)
    const tokens = await this.getAccessToken()
    const token = tokens.accessToken
    var headers_object = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const httpOptions = {
      headers: headers_object
    };
    const response = await this.http.post<any>(url, payload, {
      headers: {
          Authorization: `Bearer ${token}`
      }
    }).toPromise()

    let transformResponse = {}
    transformResponse['hs-homepage-top-products'] = response.batch.find(item => item.widget.rfkid === 'hs-homepage-top-products')
      .content.product.value.map(this.mapProduct.bind(this))
    transformResponse['hs-homepage-herobanner'] = response.batch.find(item => item.widget.rfkid === 'hs-homepage-herobanner')
      .appearance.templates
    return transformResponse
}
 

}

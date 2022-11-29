# Sitecore Discover Integration with Ordercloud

The purpose of this sample code is to integrate Sitecore Discover with Ordercloud with rest API and widgit based integration with implementing some usefull use cases.

1. Preview search, which provides visual autocomplete functionality in the search field
2. Search results page
3. Landing pages, and product listing pages
4. Product details page recommendations

## Initial Setup
1. Get Access to Sitecore Discover Sandbox (https://account.rfksrv.com)) - If you don't have access send mail to PartnerEnablement@sitecore.com email. https://doc.sitecore.com/discover/en/developers/discover-developer-guide/getting-started-with-your-discover-integration.html
2. After login to sandbox you can able to see the Sitecore discover dashboard.you will able to see so may options first focus on Catalog and Developer resource.
3. In Catalog you can able to seee list of products which generally sync from Commerce PIm but here we have sandbox already having products. So we will sync products from Sitecore Discover to Order Cloud.
4. Before sync we have to setup the API access to connect the Sitecore Discover with any system with rest API.
   - ## Customer Key: 
      It is created by defaukt and used with rest API request.
   - ## Beacon:
      A single line of JavaScript code to be placed in the header of all conversion funnel pages of the website.
   - ## API Keys : 
      To pass in Rest API request.
 5. Now we can use the import utility provided by Crhistian Ramirez - https://github.com/crhistianramirez/rfk-oc-feed-importer
 6. Setup you headstart application https://github.com/ordercloud-api/headstart
 7. Post Products import from Sitecore Discover to Ordercloud we have to setup some fields like Seller address and mapping of catalog.

## Sitecore Order Cloud Headstart Buyer APP Setup and code implementation.
1. Add Beacon js to head section of index.html in Buyer app.
   <script type="text/javascript" src="https://riggsandporter.rfk.riggsandporter.com/api/init/1/init.js" async="true"></script>
   <script type="text/javascript" src="https://1257xxxxx-prod.rfksrv.com/rfk/js/**11269-12xxx7321**/init.js" async="true"></script>
      

2. We have to implement the discover service class to integrate the Sitecore Discover.
## Functions Usages and Use cases 
(https://github.com/chauhanvikas/SitecoreDiscoverSearch/blob/main/Buyer/src/app/services/ReflektionService/ReflektionService.ts)

- Copy or merge the repo code with Ordercloud headstart buyer app to integrate with the Discover. 
- To connect the Discover API, we must first call the access token APi in order to obtain the token, which will be passed to each and every Discover API call, whether it is pushing or reading data.The **"getAccessToken"** function is implemented in the **ReflecktionService** class to obtain the token. Please replace the value "xxxx" of **"x-api-key"** argument in "getAccessToken" function that you will receive from the Discov Developer Resource Dashboard  **"API Access "** section.

## Use Case 1 : Buyer app Product Listing from Discover
| Function Name | Caller Function Name | Description
| --- | --- | --- |
| **SearchReflektion** func in **ReflecktionService** class  | **listProducts** function of **ProductFilterService**** class | To retrieve the products from Discover, the SearchReflektion method is implemented in the RefletionService class. The "listProducts" function of the ProductFilterService class calls this function. |

## Use Case 2 : Gather user behavior, action, and event data, then push it to Discover for AI-based product recommendation.roducts 

- Products viewed by User push to Discover

| Function Name | Caller Function Name | Description
| --- | --- | --- |
| **TrackProductView** func in **ReflecktionService** class  | Called in **product-details.component.ts** class line no 105| Pushing the product visit data to Sitecore Discover |

- Pushed products added to Cart by user in Sitecore Diocover

| Function Name | Caller Function Name | Description
| --- | --- | --- |
| **TrackAddToCart** func in **ReflecktionService** class  | Called in **cart.service.ts** class line no 106 | Pushing the product data to Sitecore Discover which are added to cart |

- Pushed Order data in Sitecore Diocover submitted by user

| Function Name | Caller Function Name | Description
| --- | --- | --- |
| **TrackOrderSubmit ** func in **ReflecktionService** class  | Called in **checkout.component.ts** class line no 279 | Pushing the Order data to Sitecore Discover which are added by user |

.

 



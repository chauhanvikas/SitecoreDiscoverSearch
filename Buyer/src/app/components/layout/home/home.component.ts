import { faBullhorn } from '@fortawesome/free-solid-svg-icons'
import { Component, OnInit } from '@angular/core'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { ShopperContextService } from 'src/app/services/shopper-context/shopper-context.service'
import { HSMeProduct } from '@ordercloud/headstart-sdk'
import { ReflektionService } from 'src/app/services/ReflektionService/ReflektionService'
@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class OCMHomePage implements OnInit {
  featuredProducts: HSMeProduct[]
  faBullhorn = faBullhorn
  URL = '../../../assets/jumbotron.svg'
  topProducts: HSMeProduct[]
  heroBannerHtml: SafeHtml
  

  constructor(
    private context: ShopperContextService,
    private reflektionService: ReflektionService,
    private domSanitizer: DomSanitizer
  ) { }

  async ngOnInit(): Promise<void> {
    const user = this.context.currentUser.get()
    /*if (!user?.UserGroups?.length) {
      this.featuredProducts = []
    } else {
      const products = await this.context.tempSdk.listMeProducts({
        filters: { 'xp.Featured': true },
      })
      this.featuredProducts = products.Items
    }*/
    const userId = this.context.currentUser.isAnonymous ? null : this.context.currentUser.get().ID
    const result = await this.reflektionService.getHomePageWidgetData(userId)
    
    const style = "<style>" + result["hs-homepage-herobanner"].css.devices.pc.content + "</style>",
    html = '<div data-rfkid class="rfk2_banner rfk2_hs-homepage-herobanner">' + result["hs-homepage-herobanner"].html.devices.pc.content + "</div>"
    this.heroBannerHtml = this.domSanitizer.bypassSecurityTrustHtml(style + html),
    this.topProducts = result['hs-homepage-top-products']
  }

  toSupplier(supplier: string): void {
    this.context.router.toProductList({
      activeFacets: { Supplier: supplier.toLocaleLowerCase() },
    })
  }
}


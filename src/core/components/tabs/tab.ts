// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, Input, Output, OnInit, OnDestroy, ElementRef, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CoreTabBase } from '@classes/tabs';

import { CoreDomUtils } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';
import { CoreNavBarButtonsComponent } from '../navbar-buttons/navbar-buttons';
import { CoreTabsComponent } from './tabs';

/**
 * A tab to use inside core-tabs. The content of this tab will be displayed when the tab is selected.
 *
 * You must provide either a title or an icon for the tab.
 *
 * The tab content MUST be surrounded by ng-template. This component uses ngTemplateOutlet instead of ng-content because the
 * latter executes all the code immediately. This means that all the tabs would be initialized as soon as your view is
 * loaded, leading to performance issues.
 *
 * Example usage:
 *
 * <core-tabs selectedIndex="1">
 *     <core-tab [title]="'core.courses.timeline' | translate" (ionSelect)="switchTab('timeline')">
 *         <ng-template> <!-- This ng-template is required. -->
 *             <!-- Tab contents. -->
 *         </ng-template>
 *     </core-tab>
 * </core-tabs>
 */
@Component({
    selector: 'core-tab',
    template: '<ng-container *ngIf="loaded" [ngTemplateOutlet]="template"></ng-container>',
})
export class CoreTabComponent implements OnInit, OnDestroy, CoreTabBase {

    @Input() title!: string; // The tab title.
    @Input() icon?: string; // The tab icon.
    @Input() badge?: string; // A badge to add in the tab.
    @Input() badgeStyle?: string; // The badge color.
    @Input() enabled = true; // Whether the tab is enabled.
    @Input() class?: string; // Class, if needed.
    @Input() set show(val: boolean) { // Whether the tab should be shown. Use a setter to detect changes on the value.
        if (typeof val != 'undefined') {
            const hasChanged = this.isShown != val;
            this.isShown = val;

            if (this.initialized && hasChanged) {
                this.tabs.tabVisibilityChanged();
            }
        }
    }

    @Input() id?: string; // An ID to identify the tab.
    @Output() ionSelect: EventEmitter<CoreTabComponent> = new EventEmitter<CoreTabComponent>();

    @ContentChild(TemplateRef) template?: TemplateRef<unknown>; // Template defined by the content.

    element: HTMLElement; // The core-tab element.
    loaded = false;
    initialized = false;
    isShown = true;
    tabElement?: HTMLElement | null;

    constructor(
        protected tabs: CoreTabsComponent,
        element: ElementRef,
    ) {
        this.element = element.nativeElement;

        this.element.setAttribute('role', 'tabpanel');
        this.element.setAttribute('tabindex', '0');
    }

    /**
     * Component being initialized.
     */
    ngOnInit(): void {
        this.id = this.id || 'core-tab-' + CoreUtils.getUniqueId('CoreTabComponent');
        this.element.setAttribute('aria-labelledby', this.id + '-tab');
        this.element.setAttribute('id', this.id);

        this.tabs.addTab(this);
        this.initialized = true;
    }

    /**
     * Component destroyed.
     */
    ngOnDestroy(): void {
        this.tabs.removeTab(this);
    }

    /**
     * Select tab.
     */
    async selectTab(): Promise<void> {
        this.element.classList.add('selected');

        this.tabElement = this.tabElement || document.getElementById(this.id + '-tab');
        this.tabElement?.setAttribute('aria-selected', 'true');

        this.loaded = true;
        this.ionSelect.emit(this);
        this.showHideNavBarButtons(true);

        // Setup tab scrolling.
        this.tabs.listenContentScroll(this.element, this.id!);
    }

    /**
     * Unselect tab.
     */
    unselectTab(): void {
        this.tabElement?.setAttribute('aria-selected', 'false');
        this.element.classList.remove('selected');
        this.showHideNavBarButtons(false);
    }

    /**
     * Show all hide all children navbar buttons.
     *
     * @param show Whether to show or hide the buttons.
     */
    protected showHideNavBarButtons(show: boolean): void {
        const elements = this.element.querySelectorAll('core-navbar-buttons');
        elements.forEach((element) => {
            const instance: CoreNavBarButtonsComponent = CoreDomUtils.getInstanceByElement(element);

            if (instance) {
                instance.forceHide(!show);
            }
        });
    }

}
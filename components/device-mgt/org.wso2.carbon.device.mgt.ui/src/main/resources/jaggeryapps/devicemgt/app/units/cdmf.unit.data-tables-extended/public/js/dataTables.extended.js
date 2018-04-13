/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* ========================================================================
 * datatables_extended function
 * ======================================================================== */
$.fn.datatables_extended = function (settings) {

    var elem = $(this);

    // EMM related function
    if (InitiateViewOption) {
        $(document).on('click', '.viewEnabledIcon', InitiateViewOption);
    }
    //--- End of EMM related codes

    /*
     * Work around for accessing settings params inside datatable functions
     */
    if (settings != null && settings.sorting != null && settings.sorting != undefined && settings.sorting) {
        elem.addClass('sorting-enabled');
    } else {
        elem.addClass('sorting-disabled');
    }

    $(elem).DataTable(
        $.extend({}, {
            bSortCellsTop: true,
            responsive: false,
            autoWidth: false,
            dom: '<"dataTablesTop"' +
            'f' +
            '<"dataTables_toolbar">' +
            '>' +
            'rt' +
            '<"dataTablesBottom"' +
            'lip' +
            '>',
            language: {
            	searchPlaceholder: '搜索 ...',
                search: '',
                "sProcessing": "处理中...",
                "sLengthMenu": "显示 _MENU_ 项结果",
                "sZeroRecords": "没有匹配结果",
                "sInfo": "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
                "sInfoEmpty": "显示第 0 至 0 项结果，共 0 项",
                "sInfoFiltered": "(由 _MAX_ 项结果过滤)",
                "sInfoPostFix": "",
                "sSearch": "搜索:",
                "sUrl": "",
                "sEmptyTable": "表中数据为空",
                "sLoadingRecords": "载入中...",
                "sInfoThousands": ",",
                "oPaginate": {
                    "sFirst": "首页",
                    "sPrevious": "上页",
                    "sNext": "下页",
                    "sLast": "末页"
                },
                "oAria": {
                    "sSortAscending": ": 以升序排列此列",
                    "sSortDescending": ": 以降序排列此列"
                }
            },
            
            initComplete: function () {
                var cachedFilterRes;
                this.api().columns().every(function () {

                    var column = this;
                    var filterColumn = $('.filter-row th', elem);

                    /**
                     *  Create & add select/text filters to each column
                     */
                    if (filterColumn.eq(column.index()).hasClass('select-filter')) {
                        var select = $('<select class="form-control"><option value="">All</option></select>')
                            .appendTo(filterColumn.eq(column.index()).empty())
                            .on('change', function () {
                                var val = $.fn.dataTable.util.escapeRegex(
                                    $(this).val()
                                );

                                column
                                //.search(val ? '^' + val + '$' : '', true, false)
                                    .search(val ? val : '', true, false)
                                    .draw();

                                if (filterColumn.eq(column.index()).hasClass('data-platform')) {
                                    if (val == null || val == undefined || val == "") {
                                        $("#operation-bar").hide();
                                        $("#operation-guide").show();
                                        $("#operation-bar").addClass("hidden");
                                    } else {
                                        $("#operation-guide").hide();
                                        $("#operation-bar").removeClass("hidden");
                                        $("#operation-bar").show();
                                        //TODO: Enable after adding iot operations bar
                                        //loadOperationBar(val);
                                    }

                                }
                            });

                        if (!cachedFilterRes) {
                            $.ajax(
                                {
                                    url: context + "/api/data-tables/invoker/filters",
                                    async:false,
                                    success: function(data) {
                                        cachedFilterRes = data;
                                    }
                                }
                            );
                        }

                        $(column).each(function () {
                            var i;
                            if (filterColumn.eq(column.index()).hasClass('data-status')) {
                                for(i = 0; i < cachedFilterRes.status.length; i++){
                                    var status = cachedFilterRes.status[i];
                                    select.append('<option value="' + status + '">' + status + '</option>')
                                }
                            } else if (filterColumn.eq(column.index()).hasClass('data-ownership')) {
                                for(i = 0; i < cachedFilterRes.ownership.length; i++){
                                    var ownership = cachedFilterRes.ownership[i];
                                    select.append('<option value="' + ownership + '">' + ownership + '</option>')
                                }
                            } else if (filterColumn.eq(column.index()).hasClass('data-platform')) {
                                for(i = 0; i < cachedFilterRes.deviceTypes.length; i++){
                                    var deviceTypes = cachedFilterRes.deviceTypes[i];
                                    var name = deviceTypes;
                                    var value = deviceTypes;
                                    if (deviceTypes.name && deviceTypes.value) {
                                        name = deviceTypes.name;
                                        value = deviceTypes.value;
                                    }
                                    select.append('<option value="' + value + '">' + name + '</option>')
                                }
                            } else if (filterColumn.eq(column.index()).hasClass('data-compliance')) {
                                for(i = 0; i < cachedFilterRes.deviceTypes.length; i++){
                                    var compliance = cachedFilterRes.compliance[i];
                                    select.append('<option value="' + compliance + '">' + compliance + '</option>')
                                }
                            } else if ($(column.nodes()).attr('data-search')) {
                                var values = [];
                                column.nodes().unique().sort().each(function (d, j) {
                                    var title = $(d).attr('data-display');
                                    var value = $(d).attr('data-search');
                                    if ($.inArray(value, values) < 0) {
                                        values.push(value);
                                        if (value !== undefined) {
                                            select.append('<option value="' + value + '">' + title + '</option>')
                                        }
                                    }
                                });
                            }
                            else {
                                column.data().unique().sort().each(function (d, j) {
                                    select.append('<option value="' + d + '">' + d + '</option>')
                                });
                            }
                        });
                    }
                    else if (filterColumn.eq(column.index()).hasClass('text-filter')) {
                        var title = filterColumn.eq(column.index()).attr('data-for');
                        $(filterColumn.eq(column.index()).empty()).html('<input type="text" class="form-control" ' +
                            'placeholder="Search ' + title + '" />');

                        filterColumn.eq(column.index()).find('input').on('keyup change', function () {
                            column.search($(this).val()).draw();
                            if ($('.dataTables_empty').length > 0) {
                                $('.bulk-action-row').addClass("hidden");
                            } else {
                                $('.bulk-action-row').removeClass("hidden");
                            }
                        });
                    }

                });

                /**
                 *  search input default styles override
                 */
                var search_input = $(this).closest('.dataTables_wrapper').find('div[id$=_filter] input');
                search_input.before('<i class="fw fw-search search-icon"></i>').removeClass('input-sm');

                /**
                 *  create sorting dropdown menu for list table advance operations
                 */
                var table = this;
                if (table.hasClass('sorting-enabled')) {
                    var dropdownmenu = $('<ul class="dropdown-menu arrow arrow-top-right dark sort-list ' +
                        'add-margin-top-2x"><li class="dropdown-header">Sort by</li></ul>');
                    $('.sort-row th', elem).each(function () {
                        if (!$(this).hasClass('no-sort')) {
                            dropdownmenu.append('<li><a href="#' + $(this).html() + '" data-column="' + $(this).index() +
                                '">' + $(this).html() + '</a></li>');
                        }
                    });
                }

                function getAdvanceToolBar() {
                    var selectableBtnHtml = "";
                    if (!table.hasClass('no-toolbar')) {
                        if (table.hasClass('sorting-enabled')) {
                            if(!table.hasClass('un-selectable')) {
                                selectableBtnHtml = '<li><button data-click-event="toggle-selectable" class="btn btn-default btn-primary select-enable-btn">Select</li>' +
                                                    '<li><button data-click-event="toggle-selected" id="dt-select-all" class="btn btn-default btn-primary disabled">Select All</li>';
                            }
                            return '<ul class="nav nav-pills navbar-right remove-margin" role="tablist">' + selectableBtnHtml +
                                   '<li><button data-click-event="toggle-list-view" data-view="grid" class="btn btn-default"><i class="fw fw-grid"></i></button></li>' +
                                   '<li><button data-click-event="toggle-list-view" data-view="list" class="btn btn-default"><i class="fw fw-list"></i></button></li>' +
                                   '<li><button class="btn btn-default" data-toggle="dropdown"><i class="fw fw-sort"></i></button>' + dropdownmenu[0].outerHTML + '</li>' +
                                   '</ul>'
                        } else {
                            if(!table.hasClass('un-selectable')) {
                                selectableBtnHtml = '<li><button data-click-event="toggle-selectable" class="btn btn-default btn-primary select-enable-btn">Select</li>' +
                                                    '<li><button data-click-event="toggle-selected" id="dt-select-all" class="btn btn-default btn-primary disabled">Select All</li>';
                            }
                            return '<ul class="nav nav-pills navbar-right remove-margin" role="tablist">' + selectableBtnHtml +
                                   '<li><button data-click-event="toggle-list-view" data-view="grid" class="btn btn-default"><i class="fw fw-grid"></i></button></li>' +
                                   '<li><button data-click-event="toggle-list-view" data-view="list" class="btn btn-default"><i class="fw fw-list"></i></button></li>' +
                                   '</ul>'
                        }
                    } else {
                        return '';
                    }
                }


                /**
                 *  append advance operations to list table toolbar
                 */
                $('.dataTable.list-table').closest('.dataTables_wrapper').find('.dataTablesTop .dataTables_toolbar').html(
                    getAdvanceToolBar()
                );

                /**
                 *  sorting dropdown menu select function
                 */
                $('.dataTables_wrapper .sort-list li a').click(function () {
                    $(this).closest('li').siblings('li').find('a').removeClass('sorting_asc').removeClass('sorting_desc');

                    var thisTable = $(this).closest('.dataTables_wrapper').find('.dataTable').dataTable();

                    if (!($(this).hasClass('sorting_asc')) && !($(this).hasClass('sorting_desc'))) {
                        $(this).addClass('sorting_asc');
                        thisTable.fnSort([[$(this).attr('data-column'), 'asc']]);
                    }
                    else if ($(this).hasClass('sorting_asc')) {
                        $(this).switchClass('sorting_asc', 'sorting_desc');
                        thisTable.fnSort([[$(this).attr('data-column'), 'desc']]);
                    }
                    else if ($(this).hasClass('sorting_desc')) {
                        $(this).switchClass('sorting_desc', 'sorting_asc');
                        thisTable.fnSort([[$(this).attr('data-column'), 'asc']]);
                    }
                });

                var rowSelectedClass = 'DTTT_selected selected';

                /**
                 *  Enable/Disable selection on rows
                 */
                $('.dataTables_wrapper [data-click-event=toggle-selectable]').click(function () {
                    var button = this,
                        thisTable = $(this).closest('.dataTables_wrapper').find('.dataTable').dataTable();
                    if ($(button).html() == 'Select') {
                        thisTable.addClass("table-selectable");
                        $(button).addClass("active").html('Cancel');
                        $(button).parent().next().children("button").removeClass("disabled");
                        // EMM related code
                        $(document).off('click', '.viewEnabledIcon');
                        //--- End of EMM related codes
                    } else if ($(button).html() == 'Cancel') {
                        $('.bulk-action-row').addClass('hidden');
                        thisTable.removeClass("table-selectable");
                        $(button).addClass("active").html('Select');
                        $(button).parent().next().children().addClass("disabled");
                        // EMM related function
                        $(document).on('click', '.viewEnabledIcon', InitiateViewOption);
                        //--- End of EMM related codes
                    }
                });
                /**
                 *  select/deselect all rows function
                 */
                $('.dataTables_wrapper [data-click-event=toggle-selected]').click(function () {
                    var button = this,
                        thisTable = $(this).closest('.dataTables_wrapper').find('.dataTable').dataTable();
                    if ($(button).html() == 'Select All') {
                        $(button).html('Deselect All');
                        $('.bulk-action-row').removeClass('hidden');
                        thisTable.api().rows().every(function () {
                            $(this.node()).addClass(rowSelectedClass);
                        });
                    }
                    else if ($(button).html() == 'Deselect All') {
                        $('.bulk-action-row').addClass('hidden');
                        $(button).html('Select All');
                        thisTable.api().rows().every(function () {
                            $(this.node()).removeClass(rowSelectedClass);
                        });
                    }
                });

                /**
                 *  on row click select/deselect row function
                 */
                $('body').on('click', '[data-type=selectable]', function () {
                    var rowSelectedClass = 'DTTT_selected selected';
                    $(this).toggleClass(rowSelectedClass);
                    if ($('.table-selectable .DTTT_selected').length > 0) {
                        $('.bulk-action-row').removeClass('hidden');
                    } else {
                        $('.bulk-action-row').addClass('hidden');
                    }
                    var button = this,
                        thisTable = $(this).closest('.dataTables_wrapper').find('.dataTable').dataTable();

                    thisTable.api().rows().every(function () {
                        if (!$(this.node()).hasClass(rowSelectedClass)) {
                            $(button).closest('.dataTables_wrapper').find('[data-click-event=toggle-selected]').
                            html('Select All');
                        }
                    });
                });

                /**
                 *  list table list/grid view toggle function
                 */
                var toggleButton = $('[data-click-event=toggle-list-view]');
                toggleButton.click(function () {
                    if ($(this).attr('data-view') == 'grid') {
                        $(this).closest('.dataTables_wrapper').find('.dataTable').addClass('grid-view');
                        //$(this).closest('li').hide();
                        //$(this).closest('li').siblings().show();
                    }
                    else {
                        $(this).closest('.dataTables_wrapper').find('.dataTable').removeClass('grid-view');
                        //$(this).closest('li').hide();
                        //$(this).closest('li').siblings().show();
                    }
                });
            }
        }, settings)
    );

};
